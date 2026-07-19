import express from "express";
import {
  getCategoryValidator,
  createCategoryValidator,
  updateCategoryValidator,
  deleteCategoryValidator,
} from "../utils/validators/categoryValidator.js";

import {
  getCategories,
  createCategory,
  getCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
  resizeImage,
} from "../services/categoryService.js";

import { protect, allowedTo } from "../services/authService.js";

import subcategoriesRoute from "./subCategoryRoute.js";

const router = express.Router();

// Nested route for subcategories
router.use("/:categoryId/subcategories", subcategoriesRoute);

// http://localhost:8000/api/v1/categories
router
  .route("/")
  .get(getCategories)
  .post(
    protect,
    allowedTo("admin", "manager"),
    uploadCategoryImage,
    resizeImage,
    createCategoryValidator,
    createCategory,
  );
router
  .route("/:id")
  .get(getCategoryValidator, getCategory)
  .put(
    protect,
    allowedTo("admin", "manager"),
    uploadCategoryImage,
    resizeImage,
    updateCategoryValidator,
    updateCategory,
  )
  .delete(protect, allowedTo("admin"), deleteCategoryValidator, deleteCategory);

export default router;
