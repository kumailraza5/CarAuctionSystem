import { db, notificationsTable } from "@workspace/db";

interface CreateNotificationInput {
  userId: number;
  type: "outbid" | "auction_won" | "auction_ended" | "vehicle_approved" | "vehicle_rejected" | "new_message";
  message: string;
  auctionId?: number;
  vehicleId?: number;
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  await db.insert(notificationsTable).values({
    userId: input.userId,
    type: input.type,
    message: input.message,
    auctionId: input.auctionId,
    vehicleId: input.vehicleId,
  });
}
