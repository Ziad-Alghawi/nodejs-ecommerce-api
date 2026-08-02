import express from "express";

import { addProductToCart } from "../services/cartService.js";

import { protect, allowedTo } from "../services/authService.js";

const router = express.Router();

// http://localhost:8000/api/v1/Carts
router.route("/").post(protect, allowedTo("user"), addProductToCart);

export default router;
