import express from "express";
import {
  createReviewValidator,
  getReviewValidator,
  updateReviewValidator,
  deleteReviewValidator,
} from "../utils/validators/reviewValidator.js";

import {
  getReviews,
  createReview,
  getReview,
  updateReview,
  deleteReview,
  createFilterObject,
  setProductIdAndUserIdToBody,
} from "../services/reviewService.js";

import { protect, allowedTo } from "../services/authService.js";

const router = express.Router({ mergeParams: true }); // mergeParams to access params from parent route (productId)

// http://localhost:8000/api/v1/reviews
router
  .route("/")
  .get(createFilterObject, getReviews)
  .post(
    protect,
    allowedTo("user"),
    setProductIdAndUserIdToBody,
    createReviewValidator,
    createReview,
  );
router
  .route("/:id")
  .get(getReviewValidator, getReview)
  .put(protect, allowedTo("user"), updateReviewValidator, updateReview)
  .delete(
    protect,
    allowedTo("user", "admin", "manager"),
    deleteReviewValidator,
    deleteReview,
  );

export default router;
