import { db, usersTable, vehiclesTable, auctionsTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // Create admin user
  const adminHash = await bcrypt.hash("admin123", 10);
  const [admin] = await db
    .insert(usersTable)
    .values({
      name: "Admin User",
      email: "admin@autoauction.com",
      passwordHash: adminHash,
      role: "admin",
    })
    .onConflictDoNothing()
    .returning();

  // Create seller users
  const sellerHash = await bcrypt.hash("seller123", 10);
  const [seller1] = await db
    .insert(usersTable)
    .values({
      name: "John Motors",
      email: "john@motors.com",
      passwordHash: sellerHash,
      role: "seller",
      location: "Los Angeles, CA",
      phone: "+1 (310) 555-0100",
    })
    .onConflictDoNothing()
    .returning();

  const [seller2] = await db
    .insert(usersTable)
    .values({
      name: "Premium Auto Sales",
      email: "premium@autosales.com",
      passwordHash: sellerHash,
      role: "seller",
      location: "Miami, FL",
      phone: "+1 (305) 555-0200",
    })
    .onConflictDoNothing()
    .returning();

  // Create buyer
  const buyerHash = await bcrypt.hash("buyer123", 10);
  const [buyer1] = await db
    .insert(usersTable)
    .values({
      name: "Sarah Johnson",
      email: "sarah@email.com",
      passwordHash: buyerHash,
      role: "buyer",
      location: "New York, NY",
    })
    .onConflictDoNothing()
    .returning();

  if (!seller1 || !seller2) {
    console.log("Users already seeded, skipping vehicles...");
    return;
  }

  // Create vehicles
  const [v1] = await db
    .insert(vehiclesTable)
    .values({
      sellerId: seller1.id,
      title: "2022 BMW M3 Competition",
      description: "Pristine condition M3 Competition with full service history. Carbon fiber package, upgraded brakes, and M Sport exhaust.",
      price: "78500",
      buyNowPrice: "85000",
      images: [
        "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800",
        "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800",
      ],
      make: "BMW",
      model: "M3 Competition",
      year: 2022,
      mileage: 12500,
      condition: "used",
      status: "approved",
    })
    .returning();

  const [v2] = await db
    .insert(vehiclesTable)
    .values({
      sellerId: seller2.id,
      title: "2023 Porsche 911 Carrera S",
      description: "Factory-fresh 911 Carrera S. Sport Chrono package, PASM, PDCC. Barely driven — under 5000 miles.",
      price: "145000",
      buyNowPrice: "160000",
      images: [
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
        "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800",
      ],
      make: "Porsche",
      model: "911 Carrera S",
      year: 2023,
      mileage: 4800,
      condition: "used",
      status: "approved",
    })
    .returning();

  const [v3] = await db
    .insert(vehiclesTable)
    .values({
      sellerId: seller1.id,
      title: "2021 Tesla Model S Plaid",
      description: "Tesla Model S Plaid — 0-60 in under 2 seconds. Full Self-Driving, 21\" wheels, Tri-motor AWD.",
      price: "95000",
      images: [
        "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800",
      ],
      make: "Tesla",
      model: "Model S Plaid",
      year: 2021,
      mileage: 22000,
      condition: "used",
      status: "approved",
    })
    .returning();

  // Create active auctions
  const now = new Date();
  const endIn2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const endIn5Hours = new Date(now.getTime() + 5 * 60 * 60 * 1000);

  if (v1) {
    await db.insert(auctionsTable).values({
      vehicleId: v1.id,
      startPrice: "65000",
      currentPrice: "71500",
      startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      endTime: endIn2Days,
      status: "active",
      bidCount: 8,
    });
    await db.update(vehiclesTable).set({ hasActiveAuction: true }).where(eq(vehiclesTable.id, v1.id));
  }

  if (v2) {
    await db.insert(auctionsTable).values({
      vehicleId: v2.id,
      startPrice: "120000",
      currentPrice: "132000",
      reservePrice: "135000",
      startTime: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      endTime: endIn5Hours,
      status: "active",
      bidCount: 5,
    });
    await db.update(vehiclesTable).set({ hasActiveAuction: true }).where(eq(vehiclesTable.id, v2.id));
  }

  console.log("Seed complete!");
  console.log("Test accounts:");
  console.log("  Admin: admin@autoauction.com / admin123");
  console.log("  Seller: john@motors.com / seller123");
  console.log("  Buyer: sarah@email.com / buyer123");
}

seed().catch(console.error).finally(() => process.exit());
