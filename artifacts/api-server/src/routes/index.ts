import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import vehiclesRouter from "./vehicles";
import auctionsRouter from "./auctions";
import adminRouter from "./admin";
import notificationsRouter from "./notifications";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(vehiclesRouter);
router.use(auctionsRouter);
router.use(adminRouter);
router.use(notificationsRouter);
router.use(dashboardRouter);

export default router;
