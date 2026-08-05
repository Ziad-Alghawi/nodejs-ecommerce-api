import "./config.js";
import path from "path";

import express from "express";
import morgan from "morgan";
import cors from "cors";
import compression from "compression";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";

import ApiError from "./utils/apiError.js";
import globalError from "./middlewares/errorMiddleware.js";
import dbConnection from "./config/database.js";
import { webhookCheckout } from "./services/orderService.js";

// // Routes
import mountRoutes from "./routes/index.js";

const __dirname = path.resolve();

// Connect to database
dbConnection();

const app = express();

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

// Limit each IP to 100 requests per 15 min
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: "Too many requests from this IP, please try again after 15 minutes",
});

// Apply the rate limiting middleware to all requests.
app.use("/api/", limiter);
// app.use("/api/v1/auth", authLimiter); // more more strict

// // mount Routes
mountRoutes(app);

// Handle unhandled routes
app.all("/*splat", (req, res, next) => {
  next(new ApiError(`Can't find this route: ${req.originalUrl}`, 400));
});

// Global error handler middleware for express
app.use(globalError);

const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(`App running on port ${PORT}`);
});

// Handle rejections outside express
process.on("unhandledRejection", (err) => {
  console.error(`Unhandeled Rejection Errors: ${err.name} | ${err.message}`);
  server.close(() => {
    console.error("Shutting down...");
    process.exit(1);
  });
});
