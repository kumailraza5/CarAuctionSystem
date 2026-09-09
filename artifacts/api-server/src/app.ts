import express, { type Express } from "express";
import path from "node:path";
import fs from "node:fs";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

const vehicleUploadsDir = path.join(process.cwd(), "uploads", "vehicles");
fs.mkdirSync(vehicleUploadsDir, { recursive: true });
app.use("/uploads/vehicles", express.static(vehicleUploadsDir));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

app.use("/api", router);

// Serve static frontend build in production
const possibleFrontendPaths = [
  path.resolve(process.cwd(), "artifacts/vehicle-platform/dist/public"),
  path.resolve(process.cwd(), "artifacts/vehicle-platform/dist"),
  path.resolve(__dirname, "../../vehicle-platform/dist/public"),
  path.resolve(__dirname, "../vehicle-platform/dist/public"),
];

const frontendDist = possibleFrontendPaths.find((p) => fs.existsSync(p));
if (frontendDist) {
  app.use(express.static(frontendDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.name === "MulterError") {
    logger.warn({ err }, "Upload rejected");
    res.status(400).json({ error: err.message || "Upload failed" });
    return;
  }
  if (err instanceof Error && err.message?.includes("Only JPEG")) {
    res.status(400).json({ error: err.message });
    return;
  }
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: err.message || "Internal server error" });
});

export default app;

