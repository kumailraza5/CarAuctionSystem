import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { vehiclesTable } from "./vehicles";
import { usersTable } from "./users";

export const listingMessagesTable = pgTable("listing_messages", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull().references(() => vehiclesTable.id, { onDelete: "cascade" }),
  authorId: integer("author_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  buyerId: integer("buyer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
