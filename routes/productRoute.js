import express from "express";
import { protect, allowedTo } from "../services/authService.js";
import {
  getProductValidator,
  createProductValidator,
  updateProductValidator,
  deleteProductValidator,
} from "../utils/validators/productValidator.js";

import {
  getProducts,
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  resizeProductImages,
} from "../services/productService.js";

import reviewRoute from "./reviewRoute.js";

const router = express.Router();

// Nested route for reviews
// Post /products/ekfsdkl/reviews
// Get  /products/ekfsdkl/reviews
// Get  /products/ekfsdkl/reviews/ekfsdklfj>> get specific review for specific product
router.use("/:productId/reviews", reviewRoute);

// @desc Get list of products
// @route GET /api/v1/products
// @access Public

// @desc Create a new product
router
  .route("/")
  .get(getProducts)
  .post(
    protect,
    allowedTo("admin", "manager"),
    uploadProductImage,
    resizeProductImages,
    createProductValidator,
    createProduct,
  );

// @desc Get a specific product by id
router
  .route("/:id")
  .get(getProductValidator, getProduct)
  .put(
    protect,
    allowedTo("admin", "manager"),
    uploadProductImage,
    resizeProductImages,
    updateProductValidator,
    updateProduct,
  )
  .delete(protect, allowedTo("admin"), deleteProductValidator, deleteProduct);

export default router;
