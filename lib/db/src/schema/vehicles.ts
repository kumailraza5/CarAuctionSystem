import { pgTable, text, serial, timestamp, integer, numeric, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const vehicleConditionEnum = pgEnum("vehicle_condition", ["new", "used", "certified_pre_owned"]);
export const vehicleStatusEnum = pgEnum("vehicle_status", ["pending", "approved", "rejected", "sold"]);

export const vehiclesTable = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  /** Set when vehicle is sold via buy-now (or similar) */
  buyerId: integer("buyer_id").references(() => usersTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  buyNowPrice: numeric("buy_now_price", { precision: 12, scale: 2 }),
  images: text("images").array().notNull().default([]),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  mileage: integer("mileage"),
  condition: vehicleConditionEnum("condition").notNull(),
  status: vehicleStatusEnum("status").notNull().default("pending"),
  hasActiveAuction: boolean("has_active_auction").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertVehicleSchema = createInsertSchema(vehiclesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehiclesTable.$inferSelect;
