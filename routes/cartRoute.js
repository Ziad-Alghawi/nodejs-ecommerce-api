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
import {
  addProductToCartValidator,
  updateCartItemValidator,
  removeCartItemValidator,
  applyCouponValidator,
} from "../utils/validators/cartValidator.js";

const router = express.Router();

router.use(protect, allowedTo("user"));
// http://localhost:8000/api/v1/Carts
router
  .route("/")
  .post(addProductToCartValidator, addProductToCart)
  .get(getLoggedUserCart)
  .delete(clearCart);

router.put("/applyCoupon", applyCouponValidator, applyCoupon);

router
  .route("/:itemId")
  .put(updateCartItemValidator, UpdateCartItemQuantity)
  .delete(removeCartItemValidator, removeSpecificCartItem);

export default router;
