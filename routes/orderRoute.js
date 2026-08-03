import express from "express";

import {
  createCashOrder,
  findAllOrders,
  findSpecificOrder,
  filterOrderForLoggedUser,
  updateOrderToPaid,
  updateOrderToDelivered,
} from "../services/orderService.js";

import { protect, allowedTo } from "../services/authService.js";

const router = express.Router();

router.use(protect); // Protect all routes
// http://localhost:8000/api/v1/brands
router.route("/:cartId").post(createCashOrder);

router.get(
  "/",
  protect,
  allowedTo("user", "admin", "manager"),
  filterOrderForLoggedUser,
  findAllOrders,
);

router.get(
  "/:id",
  protect,
  allowedTo("user", "admin", "manager"),
  findSpecificOrder,
);

router.put(
  "/:id/pay",
  protect,
  allowedTo("admin", "manager"),
  updateOrderToPaid,
);
router.put(
  "/:id/deliver",
  protect,
  allowedTo("admin", "manager"),
  updateOrderToDelivered,
);

export default router;
