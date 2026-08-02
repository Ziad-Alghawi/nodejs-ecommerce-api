import express from "express";

import {
  addProductToCart,
  getLoggedUserCart,
  removeSpecificCartItem,
  clearCart,
  UpdateCartItemQuantity,
  applyCoupon,
} from "../services/cartService.js";

import { protect, allowedTo } from "../services/authService.js";

const router = express.Router();

router.use(protect, allowedTo("user"));
// http://localhost:8000/api/v1/Carts
router
  .route("/")
  .post(addProductToCart)
  .get(getLoggedUserCart)
  .delete(clearCart);

router.put("/applyCoupon", applyCoupon);

router
  .route("/:itemId")
  .put(UpdateCartItemQuantity)
  .delete(removeSpecificCartItem);

export default router;
