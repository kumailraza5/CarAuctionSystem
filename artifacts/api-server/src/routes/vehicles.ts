import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { z } from "zod";
import { db, vehiclesTable, usersTable, auctionsTable, listingMessagesTable } from "@workspace/db";
import { eq, ilike, and, or, sql, desc, asc } from "drizzle-orm";
import {
  GetVehiclesQueryParams,
  GetVehicleParams,
  CreateVehicleBody,
  UpdateVehicleParams,
  UpdateVehicleBody,
  DeleteVehicleParams,
  BuyNowParams,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { createNotification } from "../lib/notifications.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

const vehicleUploadsDir = path.join(process.cwd(), "uploads", "vehicles");
fs.mkdirSync(vehicleUploadsDir, { recursive: true });

const vehicleImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, vehicleUploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext) ? ext : ".jpg";
    cb(null, `${req.user!.id}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`);
  },
});

const vehicleImageUpload = multer({
  storage: vehicleImageStorage,
  limits: { fileSize: 8 * 1024 * 1024, files: 12 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, GIF, or WebP images are allowed"));
  },
});

function respondWithUploadedVehicleUrls(_req: Request, res: Response): void {
  const files = _req.files as Express.Multer.File[] | undefined;
  if (!files?.length) {
    res.status(400).json({ error: "No image files provided" });
    return;
  }
  const urls = files.map((f) => `/uploads/vehicles/${f.filename}`);
  res.json({ urls });
}

const postListingMessageBody = z.object({
  body: z.string().min(1).max(4000),
  buyerId: z.coerce.number().optional(),
});

async function formatVehicle(vehicle: typeof vehiclesTable.$inferSelect) {
  const [seller] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, vehicle.sellerId));
  return {
    id: vehicle.id,
    sellerId: vehicle.sellerId,
    buyerId: vehicle.buyerId ?? null,
    sellerName: seller?.name ?? "Unknown",
    title: vehicle.title,
    description: vehicle.description,
    price: Number(vehicle.price),
    buyNowPrice: vehicle.buyNowPrice != null ? Number(vehicle.buyNowPrice) : null,
    images: vehicle.images,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    mileage: vehicle.mileage ?? null,
    condition: vehicle.condition,
    status: vehicle.status,
    hasActiveAuction: vehicle.hasActiveAuction,
    createdAt: vehicle.createdAt,
    updatedAt: vehicle.updatedAt,
  };
}

router.get("/vehicles", async (req, res): Promise<void> => {
  const params = GetVehiclesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { search, status, sellerId, limit = 20, offset = 0 } = params.data;

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(vehiclesTable.title, `%${search}%`),
        ilike(vehiclesTable.make, `%${search}%`),
        ilike(vehiclesTable.model, `%${search}%`),
      )
    );
  }
  if (status) {
    conditions.push(eq(vehiclesTable.status, status as "pending" | "approved" | "rejected" | "sold"));
  } else {
    conditions.push(eq(vehiclesTable.status, "approved"));
  }
  if (sellerId) {
    conditions.push(eq(vehiclesTable.sellerId, sellerId));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(vehiclesTable).where(where);
  const vehicles = await db
    .select()
    .from(vehiclesTable)
    .where(where)
    .orderBy(desc(vehiclesTable.createdAt))
    .limit(limit)
    .offset(offset);

  const formatted = await Promise.all(vehicles.map(formatVehicle));
  res.json({ vehicles: formatted, total: count });
});

const vehicleImagesUploadMiddleware = vehicleImageUpload.array("images", 12);

router.post(
  "/vehicles/upload-images",
  requireAuth,
  requireRole("seller", "admin"),
  vehicleImagesUploadMiddleware,
  respondWithUploadedVehicleUrls,
);

/** Legacy path (older frontends / cached bundles hit this URL). */
router.post(
  "/upload/vehicle-images",
  requireAuth,
  requireRole("seller", "admin"),
  vehicleImagesUploadMiddleware,
  respondWithUploadedVehicleUrls,
);

router.get("/vehicles/purchases/mine", requireAuth, async (req, res): Promise<void> => {
  const uid = req.user!.id;
  const purchased = await db
    .select()
    .from(vehiclesTable)
    .where(and(eq(vehiclesTable.buyerId, uid), eq(vehiclesTable.status, "sold")))
    .orderBy(desc(vehiclesTable.updatedAt));
  const formatted = await Promise.all(purchased.map(formatVehicle));
  res.json({ vehicles: formatted });
});

router.post("/vehicles", requireAuth, requireRole("seller", "admin"), async (req, res): Promise<void> => {
  const parsed = CreateVehicleBody.safeParse(req.body);
  if (!parsed.success) {
    logger.error({ error: parsed.error.message }, "Zod Validation Error");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const [vehicle] = await db
      .insert(vehiclesTable)
      .values({
        ...parsed.data,
        sellerId: req.user!.id,
        price: String(parsed.data.price),
        buyNowPrice: parsed.data.buyNowPrice != null ? String(parsed.data.buyNowPrice) : null,
      })
      .returning();

    res.status(201).json(await formatVehicle(vehicle));
  } catch (err: any) {
    logger.error({ err }, "DB Insert Error");
    res.status(500).json({ error: err.message });
  }
});

router.get("/vehicles/:vehicleId", async (req, res): Promise<void> => {
  const params = GetVehicleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, params.data.vehicleId));
  if (!vehicle) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  res.json(await formatVehicle(vehicle));
});

function canAccessListingMessages(
  vehicle: typeof vehiclesTable.$inferSelect,
  userId: number,
  role: string,
): boolean {
  if (role === "admin") return true;
  if (vehicle.sellerId === userId) return true;
  if (vehicle.buyerId != null && vehicle.buyerId === userId) return true;
  if (vehicle.status === "approved" && role === "buyer" && vehicle.sellerId !== userId) return true;
  return false;
}

function canPostListingMessage(
  vehicle: typeof vehiclesTable.$inferSelect,
  userId: number,
  role: string,
): boolean {
  if (role === "admin") return true;
  if (vehicle.sellerId === userId) return true;
  if (vehicle.buyerId != null && vehicle.buyerId === userId) return true;
  if (vehicle.status === "approved" && role === "buyer" && vehicle.sellerId !== userId) return true;
  if (vehicle.status === "sold" && vehicle.buyerId === userId) return true;
  return false;
}

router.get("/vehicles/:vehicleId/threads", requireAuth, requireRole("seller", "admin"), async (req, res): Promise<void> => {
  const params = GetVehicleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const vid = params.data.vehicleId;
  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, vid));
  if (!vehicle) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }
  if (req.user!.role !== "admin" && vehicle.sellerId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const threads = await db
    .select({
      buyerId: listingMessagesTable.buyerId,
      buyerName: usersTable.name,
    })
    .from(listingMessagesTable)
    .innerJoin(usersTable, eq(usersTable.id, listingMessagesTable.buyerId))
    .where(eq(listingMessagesTable.vehicleId, vid))
    .groupBy(listingMessagesTable.buyerId, usersTable.name);
    
  res.json(threads);
});

router.get("/vehicles/:vehicleId/messages", requireAuth, async (req, res): Promise<void> => {
  const params = GetVehicleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const vid = params.data.vehicleId;
  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, vid));
  if (!vehicle) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }
  if (!canAccessListingMessages(vehicle, req.user!.id, req.user!.role)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const buyerIdQuery = req.query.buyerId ? parseInt(req.query.buyerId as string, 10) : undefined;
  let targetBuyerId: number;

  if (req.user!.role === "buyer") {
    targetBuyerId = req.user!.id;
  } else {
    if (!buyerIdQuery) {
      res.status(400).json({ error: "buyerId query parameter is required for sellers" });
      return;
    }
    targetBuyerId = buyerIdQuery;
  }

  const rows = await db
    .select({
      id: listingMessagesTable.id,
      authorId: listingMessagesTable.authorId,
      body: listingMessagesTable.body,
      createdAt: listingMessagesTable.createdAt,
    })
    .from(listingMessagesTable)
    .where(
      and(
        eq(listingMessagesTable.vehicleId, vid),
        eq(listingMessagesTable.buyerId, targetBuyerId)
      )
    )
    .orderBy(asc(listingMessagesTable.createdAt));
  const withNames = await Promise.all(
    rows.map(async (m) => {
      const [u] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, m.authorId));
      return { ...m, authorName: u?.name ?? "Unknown" };
    }),
  );
  res.json(withNames);
});

router.post("/vehicles/:vehicleId/messages", requireAuth, async (req, res): Promise<void> => {
  const params = GetVehicleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const vid = params.data.vehicleId;
  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, vid));
  if (!vehicle) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }
  if (!canPostListingMessage(vehicle, req.user!.id, req.user!.role)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const parsed = postListingMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let targetBuyerId: number;
  if (req.user!.role === "buyer") {
    targetBuyerId = req.user!.id;
  } else {
    if (!parsed.data.buyerId) {
      res.status(400).json({ error: "buyerId is required for sellers responding to messages" });
      return;
    }
    targetBuyerId = parsed.data.buyerId;
  }

  const [row] = await db
    .insert(listingMessagesTable)
    .values({ vehicleId: vid, authorId: req.user!.id, buyerId: targetBuyerId, body: parsed.data.body })
    .returning();
  const [u] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, row.authorId));

  // Send notifications in background to avoid blocking response
  (async () => {
    try {
      if (req.user!.id !== vehicle.sellerId) {
        await createNotification({
          userId: vehicle.sellerId,
          type: "new_message",
          message: `You have a new message on ${vehicle.title}`,
          vehicleId: vehicle.id,
        });
      } else {
        await createNotification({
          userId: targetBuyerId,
          type: "new_message",
          message: `You have a new message from the seller of ${vehicle.title}`,
          vehicleId: vehicle.id,
        });
      }
    } catch (err) {
      logger.error({ err }, "Failed to create notification");
    }
  })();

  res.status(201).json({
    id: row.id,
    authorId: row.authorId,
    authorName: u?.name ?? "Unknown",
    body: row.body,
    createdAt: row.createdAt,
  });
});

router.patch("/vehicles/:vehicleId", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateVehicleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, params.data.vehicleId));
  if (!existing) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  if (existing.sellerId !== req.user!.id && req.user!.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsed = UpdateVehicleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.price != null) updateData.price = String(parsed.data.price);
  if (parsed.data.buyNowPrice != null) updateData.buyNowPrice = String(parsed.data.buyNowPrice);

  const [vehicle] = await db
    .update(vehiclesTable)
    .set(updateData)
    .where(eq(vehiclesTable.id, params.data.vehicleId))
    .returning();

  res.json(await formatVehicle(vehicle));
});

router.delete("/vehicles/:vehicleId", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteVehicleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, params.data.vehicleId));
  if (!existing) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  if (existing.sellerId !== req.user!.id && req.user!.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(vehiclesTable).where(eq(vehiclesTable.id, params.data.vehicleId));
  res.json({ message: "Vehicle deleted successfully" });
});

router.post("/vehicles/:vehicleId/buy-now", requireAuth, async (req, res): Promise<void> => {
  const params = BuyNowParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, params.data.vehicleId));
  if (!vehicle) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  if (!vehicle.buyNowPrice) {
    res.status(400).json({ error: "This vehicle does not have a buy-now price" });
    return;
  }

  if (vehicle.status !== "approved") {
    res.status(400).json({ error: "Vehicle is not available for purchase" });
    return;
  }

  // Mark as sold and record buyer
  await db
    .update(vehiclesTable)
    .set({ status: "sold", buyerId: req.user!.id })
    .where(eq(vehiclesTable.id, vehicle.id));

  // Cancel any active auctions
  await db
    .update(auctionsTable)
    .set({ status: "cancelled" })
    .where(and(eq(auctionsTable.vehicleId, vehicle.id), eq(auctionsTable.status, "active")));

  try {
    await createNotification({
      userId: vehicle.sellerId,
      type: "auction_ended",
      message: `Your vehicle "${vehicle.title}" has been purchased via Buy Now for $${vehicle.buyNowPrice}.`,
      vehicleId: vehicle.id,
    });
  } catch (err) {
    logger.warn({ err }, "Buy-now succeeded but seller notification failed");
  }

  res.json({ message: "Vehicle purchased successfully" });
});

export default router;
