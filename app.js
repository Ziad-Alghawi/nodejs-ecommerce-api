import "./config.js";
import path from "path";

import express from "express";
import morgan from "morgan";
import cors from "cors";
import compression from "compression";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";

import ApiError from "./utils/apiError.js";
import globalError from "./middlewares/errorMiddleware.js";
import openApiSpec from "./docs/openapi.js";
import { webhookCheckout } from "./services/orderService.js";

// // Routes
import mountRoutes from "./routes/index.js";

const __dirname = path.resolve();

const app = express();

// Number of proxies in front of the app, so req.ip and req.protocol are correct
const trustProxy = Number(process.env.TRUST_PROXY);
if (trustProxy) app.set("trust proxy", trustProxy);

// Enable other domains to access your API
app.use(cors());
app.options("/*splat", cors());

app.use(helmet());

app.use(compression()); //Compress all routes

// Checkout webhook
app.post(
  "/webhook-checkout",
  express.raw({ type: "application/json" }),
  webhookCheckout,
);

app.set("query parser", "extended"); // to allow nested query parameters

// Middleware
app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "uploads")));
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
  console.log(`node: ${process.env.NODE_ENV}`);
}

// Health check for the hosting platform
app.get("/health", (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? "ok" : "error",
    database: isDbConnected ? "connected" : "disconnected",
  });
});

// API docs
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    customSiteTitle: "E-Commerce API Docs",
    swaggerOptions: { persistAuthorization: true },
  }),
);

// Multiplies the limits below; the tests raise it so many requests from one IP are allowed
const rateLimitScale = Number(process.env.RATE_LIMIT_SCALE) || 1;

// Limit each IP to 100 requests per 15 min
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100 * rateLimitScale,
  message: "Too many requests from this IP, please try again after 15 minutes",
});

// Stricter limit for login, signup and password reset (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20 * rateLimitScale,
  message:
    "Too many authentication attempts from this IP, please try again after 15 minutes",
});

// Apply the rate limiting middleware to all requests.
app.use("/api/", limiter);
app.use("/api/v1/auth", authLimiter);

// // mount Routes
mountRoutes(app);

// Handle unhandled routes
app.all("/*splat", (req, res, next) => {
  next(new ApiError(`Can't find this route: ${req.originalUrl}`, 400));
});

// Global error handler middleware for express
app.use(globalError);

export default app;
