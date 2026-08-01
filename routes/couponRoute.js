import express from "express";

import {
  getCoupons,
  createCoupon,
  getCoupon,
  updateCoupon,
  deleteCoupon,
} from "../services/couponService.js";

import { protect, allowedTo } from "../services/authService.js";

const router = express.Router();

// Protect all routes after this middleware
router.use(protect, allowedTo("admin", "manager"));

// http://localhost:8000/api/v1/Coupons
router.route("/").get(getCoupons).post(createCoupon);
router
  .route("/:id")
  .get(getCoupon)
  .put(updateCoupon)
  .delete(allowedTo("admin"), deleteCoupon);

export default router;
