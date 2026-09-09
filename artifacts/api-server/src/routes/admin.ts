import { Router, type IRouter } from "express";
import { db, usersTable, vehiclesTable, auctionsTable, bidsTable, notificationsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  AdminUpdateUserRoleParams,
  AdminUpdateUserRoleBody,
  AdminApproveVehicleParams,
  AdminRejectVehicleParams,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { createNotification } from "../lib/notifications.js";

const router: IRouter = Router();

router.get("/admin/users", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  const formatted = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatar: u.avatar ?? null,
    phone: u.phone ?? null,
    location: u.location ?? null,
    createdAt: u.createdAt,
  }));
  res.json(formatted);
});

router.patch("/admin/users/:userId/role", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = AdminUpdateUserRoleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = AdminUpdateUserRoleBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ role: body.data.role as "buyer" | "seller" | "admin" })
    .where(eq(usersTable.id, params.data.userId))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar ?? null,
    phone: user.phone ?? null,
    location: user.location ?? null,
    createdAt: user.createdAt,
  });
});

router.patch("/admin/vehicles/:vehicleId/approve", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = AdminApproveVehicleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [vehicle] = await db
    .update(vehiclesTable)
    .set({ status: "approved" })
    .where(eq(vehiclesTable.id, params.data.vehicleId))
    .returning();

  if (!vehicle) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  await createNotification({
    userId: vehicle.sellerId,
    type: "vehicle_approved",
    message: `Your vehicle listing "${vehicle.title}" has been approved and is now live.`,
    vehicleId: vehicle.id,
  });

  const [seller] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, vehicle.sellerId));

  res.json({
    id: vehicle.id,
    sellerId: vehicle.sellerId,
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
  });
});

router.patch("/admin/vehicles/:vehicleId/reject", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = AdminRejectVehicleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [vehicle] = await db
    .update(vehiclesTable)
    .set({ status: "rejected" })
    .where(eq(vehiclesTable.id, params.data.vehicleId))
    .returning();

  if (!vehicle) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  await createNotification({
    userId: vehicle.sellerId,
    type: "vehicle_rejected",
    message: `Your vehicle listing "${vehicle.title}" has been rejected. Please review and resubmit.`,
    vehicleId: vehicle.id,
  });

  const [seller] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, vehicle.sellerId));

  res.json({
    id: vehicle.id,
    sellerId: vehicle.sellerId,
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
  });
});

router.get("/admin/stats", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const [{ totalUsers }] = await db.select({ totalUsers: sql<number>`count(*)::int` }).from(usersTable);
  const [{ totalVehicles }] = await db.select({ totalVehicles: sql<number>`count(*)::int` }).from(vehiclesTable);
  const [{ pendingVehicles }] = await db
    .select({ pendingVehicles: sql<number>`count(*)::int` })
    .from(vehiclesTable)
    .where(eq(vehiclesTable.status, "pending"));
  const [{ activeAuctions }] = await db
    .select({ activeAuctions: sql<number>`count(*)::int` })
    .from(auctionsTable)
    .where(eq(auctionsTable.status, "active"));
  const [{ totalBids }] = await db.select({ totalBids: sql<number>`count(*)::int` }).from(bidsTable);

  res.json({
    totalUsers,
    totalVehicles,
    pendingVehicles,
    activeAuctions,
    totalBids,
    totalRevenue: 0,
  });
});

export default router;
