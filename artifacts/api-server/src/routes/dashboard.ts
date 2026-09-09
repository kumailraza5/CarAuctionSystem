import { Router, type IRouter } from "express";
import { db, vehiclesTable, auctionsTable, bidsTable, usersTable } from "@workspace/db";
import { eq, desc, sql, and, lt } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  try {
    const now = new Date();
    const soonThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Update statuses
    try {
      await db
        .update(auctionsTable)
        .set({ status: "active" })
        .where(and(eq(auctionsTable.status, "upcoming"), sql`${auctionsTable.startTime} <= ${now}`));

      await db
        .update(auctionsTable)
        .set({ status: "ended" })
        .where(and(eq(auctionsTable.status, "active"), sql`${auctionsTable.endTime} <= ${now}`));
    } catch (updateErr) {
      console.warn("Auction auto-update warning:", updateErr);
    }

    // Featured vehicles (latest approved)
    const featuredVehiclesRaw = await db
      .select()
      .from(vehiclesTable)
      .where(eq(vehiclesTable.status, "approved"))
      .orderBy(desc(vehiclesTable.createdAt))
      .limit(6);

    const featuredVehicles = await Promise.all(
      featuredVehiclesRaw.map(async (v) => {
        const [seller] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, v.sellerId));
        return {
          id: v.id,
          sellerId: v.sellerId,
          sellerName: seller?.name ?? "Unknown",
          title: v.title,
          description: v.description,
          price: Number(v.price),
          buyNowPrice: v.buyNowPrice != null ? Number(v.buyNowPrice) : null,
          images: v.images,
          make: v.make,
          model: v.model,
          year: v.year,
          mileage: v.mileage ?? null,
          condition: v.condition,
          status: v.status,
          hasActiveAuction: v.hasActiveAuction,
          createdAt: v.createdAt,
        };
      })
    );

    // Active auctions
    const activeAuctionsRaw = await db
      .select()
      .from(auctionsTable)
      .where(eq(auctionsTable.status, "active"))
      .orderBy(auctionsTable.endTime)
      .limit(6);

    const formatAuction = async (auction: typeof auctionsTable.$inferSelect) => {
      const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, auction.vehicleId));
      const [seller] = vehicle
        ? await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, vehicle.sellerId))
        : [{ name: "Unknown" }];

      return {
        id: auction.id,
        vehicleId: auction.vehicleId,
        vehicle: vehicle
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
          : null,
        startPrice: Number(auction.startPrice),
        currentPrice: Number(auction.currentPrice),
        reservePrice: auction.reservePrice != null ? Number(auction.reservePrice) : null,
        startTime: auction.startTime,
        endTime: auction.endTime,
        status: auction.status,
        winnerId: auction.winnerId ?? null,
        winnerName: null,
        bidCount: auction.bidCount,
        createdAt: auction.createdAt,
      };
    };

    const activeAuctions = await Promise.all(activeAuctionsRaw.map(formatAuction));

    // Ending soon auctions
    const endingSoonRaw = await db
      .select()
      .from(auctionsTable)
      .where(and(eq(auctionsTable.status, "active"), lt(auctionsTable.endTime, soonThreshold)))
      .orderBy(auctionsTable.endTime)
      .limit(4);

    const endingSoonAuctions = await Promise.all(endingSoonRaw.map(formatAuction));

    // Stats
    const [vehiclesCount] = await db
      .select({ totalVehicles: sql<number>`count(*)::int` })
      .from(vehiclesTable)
      .where(eq(vehiclesTable.status, "approved"));

    const [auctionsCount] = await db
      .select({ activeAuctionCount: sql<number>`count(*)::int` })
      .from(auctionsTable)
      .where(eq(auctionsTable.status, "active"));

    const [bidsCount] = await db.select({ totalBids: sql<number>`count(*)::int` }).from(bidsTable);

    res.json({
      featuredVehicles,
      activeAuctions,
      endingSoonAuctions,
      stats: {
        totalVehicles: vehiclesCount?.totalVehicles ?? 0,
        activeAuctions: auctionsCount?.activeAuctionCount ?? 0,
        totalBids: bidsCount?.totalBids ?? 0,
      },
    });
  } catch (err) {
    console.error("Dashboard Summary Error:", err);
    res.json({
      featuredVehicles: [],
      activeAuctions: [],
      endingSoonAuctions: [],
      stats: {
        totalVehicles: 0,
        activeAuctions: 0,
        totalBids: 0,
      },
    });
  }
});

export default router;
