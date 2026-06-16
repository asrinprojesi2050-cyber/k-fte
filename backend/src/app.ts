import "express-async-errors";
import cors from "cors";
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { authRouter } from "./routes/auth.routes";
import { categoriesRouter } from "./routes/categories.routes";
import { jobsRouter } from "./routes/jobs.routes";
import { offersRouter } from "./routes/offers.routes";
import { paymentsRouter } from "./routes/payments.routes";
import { providersRouter } from "./routes/providers.routes";
import { requestsRouter } from "./routes/requests.routes";
import { reviewsRouter } from "./routes/reviews.routes";
import { chatRouter } from "./routes/chat.routes";
import { uploadRouter } from "./routes/upload.routes";
import { pushRouter } from "./routes/push.routes";
import { customersRouter } from "./routes/customers.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const generalLimiter = rateLimit({ windowMs: 60_000, max: 100 });
app.use(generalLimiter);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/providers", providersRouter);
app.use("/api/requests", requestsRouter);
app.use("/api/offers", offersRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/chat", chatRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/push", pushRouter);
app.use("/api/customers", customersRouter);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use(errorHandler);

export default app;
