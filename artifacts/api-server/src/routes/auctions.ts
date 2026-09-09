import { Router, type IRouter } from "express";
import { db, auctionsTable, vehiclesTable, bidsTable, usersTable } from "@workspace/db";
import { eq, and, desc, sql, or } from "drizzle-orm";
import {
  GetAuctionsQueryParams,
  CreateAuctionBody,
  GetAuctionParams,
  GetAuctionBidsParams,
  PlaceBidParams,
  PlaceBidBody,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { createNotification } from "../lib/notifications.js";

const router: IRouter = Router();

async function formatAuction(auction: typeof auctionsTable.$inferSelect, includeBids = false) {
  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, auction.vehicleId));
  const [seller] = vehicle
    ? await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, vehicle.sellerId))
    : [{ name: "Unknown" }];

  let winner = null;
  if (auction.winnerId) {
    const [w] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, auction.winnerId));
    winner = w?.name ?? null;
  }

  const formattedVehicle = vehicle
    ? {
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
      }
    : null;

  const base = {
    id: auction.id,
    vehicleId: auction.vehicleId,
    vehicle: formattedVehicle,
    startPrice: Number(auction.startPrice),
    currentPrice: Number(auction.currentPrice),
    reservePrice: auction.reservePrice != null ? Number(auction.reservePrice) : null,
    startTime: auction.startTime,
    endTime: auction.endTime,
    status: auction.status,
    winnerId: auction.winnerId ?? null,
    winnerName: winner,
    bidCount: auction.bidCount,
    createdAt: auction.createdAt,
  };

  if (includeBids) {
    const bids = await db
      .select()
      .from(bidsTable)
      .where(eq(bidsTable.auctionId, auction.id))
      .orderBy(desc(bidsTable.createdAt));

    const bidsWithUsers = await Promise.all(
      bids.map(async (bid) => {
        const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, bid.userId));
        return {
          id: bid.id,
          auctionId: bid.auctionId,
          userId: bid.userId,
          userName: user?.name ?? "Unknown",
          amount: Number(bid.amount),
          createdAt: bid.createdAt,
        };
      })
    );

    return { ...base, bids: bidsWithUsers };
  }

  return base;
}

// Auto-update auction statuses
async function updateAuctionStatuses() {
  const now = new Date();
  // Activate upcoming auctions whose start time has passed
  await db
    .update(auctionsTable)
    .set({ status: "active" })
    .where(and(eq(auctionsTable.status, "upcoming"), sql`${auctionsTable.startTime} <= ${now}`));

  // End active auctions whose end time has passed
  const endedAuctions = await db
    .update(auctionsTable)
    .set({ status: "ended" })
    .where(and(eq(auctionsTable.status, "active"), sql`${auctionsTable.endTime} <= ${now}`))
    .returning();

  // For ended auctions, determine winner and send notifications
  for (const auction of endedAuctions) {
    const [topBid] = await db
      .select()
      .from(bidsTable)
      .where(eq(bidsTable.auctionId, auction.id))
      .orderBy(desc(bidsTable.amount))
      .limit(1);

    if (topBid) {
      await db.update(auctionsTable).set({ winnerId: topBid.userId }).where(eq(auctionsTable.id, auction.id));
      await db.update(vehiclesTable).set({ status: "sold", hasActiveAuction: false }).where(eq(vehiclesTable.id, auction.vehicleId));

      await createNotification({
        userId: topBid.userId,
        type: "auction_won",
        message: `Congratulations! You won the auction with a bid of $${topBid.amount}.`,
        auctionId: auction.id,
      });
    } else {
      await db.update(vehiclesTable).set({ hasActiveAuction: false }).where(eq(vehiclesTable.id, auction.vehicleId));
    }
  }
}

router.get("/auctions", async (req, res): Promise<void> => {
  await updateAuctionStatuses();

  const params = GetAuctionsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { status, limit = 20, offset = 0 } = params.data;

  const conditions = [];
  if (status) {
    conditions.push(eq(auctionsTable.status, status as "upcoming" | "active" | "ended" | "cancelled"));
  } else {
    conditions.push(or(eq(auctionsTable.status, "active"), eq(auctionsTable.status, "upcoming")));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(auctionsTable).where(where);
  const auctions = await db
    .select()
    .from(auctionsTable)
    .where(where)
    .orderBy(desc(auctionsTable.endTime))
    .limit(limit)
    .offset(offset);

  const formatted = await Promise.all(auctions.map((a) => formatAuction(a)));
  res.json({ auctions: formatted, total: count });
});

router.post("/auctions", requireAuth, requireRole("seller", "admin"), async (req, res): Promise<void> => {
  const parsed = CreateAuctionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { vehicleId, startPrice, reservePrice, startTime, endTime } = parsed.data;

  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, vehicleId));
  if (!vehicle) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  if (vehicle.sellerId !== req.user!.id && req.user!.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  if (vehicle.status !== "approved") {
    res.status(400).json({ error: "Vehicle must be approved before creating an auction" });
    return;
  }

  if (vehicle.hasActiveAuction) {
    res.status(400).json({ error: "Vehicle already has an active auction" });
    return;
  }

  const now = new Date();
  const startDateTime = new Date(startTime);
  const initialStatus = startDateTime <= now ? "active" : "upcoming";

  const [auction] = await db
    .insert(auctionsTable)
    .values({
      vehicleId,
      startPrice: String(startPrice),
      currentPrice: String(startPrice),
      reservePrice: reservePrice != null ? String(reservePrice) : null,
      startTime: startDateTime,
      endTime: new Date(endTime),
      status: initialStatus,
    })
    .returning();

  await db.update(vehiclesTable).set({ hasActiveAuction: true }).where(eq(vehiclesTable.id, vehicleId));

  res.status(201).json(await formatAuction(auction));
});

router.get("/auctions/:auctionId", async (req, res): Promise<void> => {
  await updateAuctionStatuses();

  const params = GetAuctionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [auction] = await db.select().from(auctionsTable).where(eq(auctionsTable.id, params.data.auctionId));
  if (!auction) {
    res.status(404).json({ error: "Auction not found" });
    return;
  }

  res.json(await formatAuction(auction, true));
});

router.get("/auctions/:auctionId/bids", async (req, res): Promise<void> => {
  const params = GetAuctionBidsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const bids = await db
    .select()
    .from(bidsTable)
    .where(eq(bidsTable.auctionId, params.data.auctionId))
    .orderBy(desc(bidsTable.createdAt));

  const bidsWithUsers = await Promise.all(
    bids.map(async (bid) => {
      const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, bid.userId));
      return {
        id: bid.id,
        auctionId: bid.auctionId,
        userId: bid.userId,
        userName: user?.name ?? "Unknown",
        amount: Number(bid.amount),
        createdAt: bid.createdAt,
      };
    })
  );

  res.json(bidsWithUsers);
});

router.post("/auctions/:auctionId/bids", requireAuth, async (req, res): Promise<void> => {
  await updateAuctionStatuses();

  const params = PlaceBidParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = PlaceBidBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [auction] = await db.select().from(auctionsTable).where(eq(auctionsTable.id, params.data.auctionId));
  if (!auction) {
    res.status(404).json({ error: "Auction not found" });
    return;
  }

  if (auction.status !== "active") {
    res.status(400).json({ error: "Auction is not active" });
    return;
  }

  const currentPrice = Number(auction.currentPrice);
  if (body.data.amount <= currentPrice) {
    res.status(400).json({ error: `Bid must be higher than current price of $${currentPrice}` });
    return;
  }

  // Find previous highest bidder to notify
  const [prevTopBid] = await db
    .select()
    .from(bidsTable)
    .where(eq(bidsTable.auctionId, auction.id))
    .orderBy(desc(bidsTable.amount))
    .limit(1);

  const [bid] = await db
    .insert(bidsTable)
    .values({
      auctionId: auction.id,
      userId: req.user!.id,
      amount: String(body.data.amount),
    })
    .returning();

  // Update auction current price and bid count
  await db
    .update(auctionsTable)
    .set({
      currentPrice: String(body.data.amount),
      bidCount: auction.bidCount + 1,
    })
    .where(eq(auctionsTable.id, auction.id));

  // Notify previous highest bidder they were outbid
  if (prevTopBid && prevTopBid.userId !== req.user!.id) {
    const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, auction.vehicleId));
    await createNotification({
      userId: prevTopBid.userId,
      type: "outbid",
      message: `You have been outbid on "${vehicle?.title ?? "a vehicle"}". New highest bid: $${body.data.amount}.`,
      auctionId: auction.id,
      vehicleId: auction.vehicleId,
    });
  }

  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, bid.userId));

  res.status(201).json({
    id: bid.id,
    auctionId: bid.auctionId,
    userId: bid.userId,
    userName: user?.name ?? "Unknown",
    amount: Number(bid.amount),
    createdAt: bid.createdAt,
  });
});

export default router;
