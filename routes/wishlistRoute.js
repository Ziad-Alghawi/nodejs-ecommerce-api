import express from "express";

import {
  addProductToWishlist,
  removeProductFromWishlist,
  getLoggedUserWishlist,
} from "../services/wishlistService.js";

import { protect, allowedTo } from "../services/authService.js";
import {
  addToWishlistValidator,
  removeFromWishlistValidator,
} from "../utils/validators/wishlistValidator.js";

const router = express.Router();

router.use(protect, allowedTo("user"));

router
  .post("/", addToWishlistValidator, addProductToWishlist)
  .get("/", getLoggedUserWishlist);

// http://localhost:8000/api/v1/wishlist
router.delete(
  "/:productId",
  removeFromWishlistValidator,
  removeProductFromWishlist,
);

export default router;
