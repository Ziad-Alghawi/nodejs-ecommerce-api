import express from "express";

import {
  createCashOrder,
  findAllOrders,
  findSpecificOrder,
  filterOrderForLoggedUser,
  updateOrderToPaid,
  updateOrderToDelivered,
  checkoutSession,
} from "../services/orderService.js";

import { protect, allowedTo } from "../services/authService.js";
import {
  createOrderValidator,
  orderIdValidator,
} from "../utils/validators/orderValidator.js";

const router = express.Router();

// Protect all routes
router.use(protect);

router.get(
  "/checkout-session/:cartId",
  allowedTo("user"),
  createOrderValidator,
  checkoutSession,
);

router
  .route("/:cartId")
  .post(allowedTo("user"), createOrderValidator, createCashOrder);

router.get(
  "/",
  allowedTo("user", "admin", "manager"),
  filterOrderForLoggedUser,
  findAllOrders,
);

router.get(
  "/:id",
  allowedTo("user", "admin", "manager"),
  orderIdValidator,
  findSpecificOrder,
);

router.put(
  "/:id/pay",
  allowedTo("admin", "manager"),
  orderIdValidator,
  updateOrderToPaid,
);
router.put(
  "/:id/deliver",
  allowedTo("admin", "manager"),
  orderIdValidator,
  updateOrderToDelivered,
);

export default router;
