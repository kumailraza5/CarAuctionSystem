import { Router, type IRouter } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { MarkNotificationReadParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, req.user!.id))
    .orderBy(desc(notificationsTable.createdAt));

  const formatted = notifications.map((n) => ({
    id: n.id,
    userId: n.userId,
    type: n.type,
    message: n.message,
    isRead: n.isRead,
    auctionId: n.auctionId ?? null,
    vehicleId: n.vehicleId ?? null,
    createdAt: n.createdAt,
  }));

  res.json(formatted);
});

router.patch("/notifications/:notificationId/read", requireAuth, async (req, res): Promise<void> => {
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [notification] = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(
      and(
        eq(notificationsTable.id, params.data.notificationId),
        eq(notificationsTable.userId, req.user!.id)
      )
    )
    .returning();

  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json({
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
    message: notification.message,
    isRead: notification.isRead,
    auctionId: notification.auctionId ?? null,
    vehicleId: notification.vehicleId ?? null,
    createdAt: notification.createdAt,
  });
});

export default router;
