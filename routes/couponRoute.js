import express from "express";

import {
  getCoupons,
  createCoupon,
  getCoupon,
  updateCoupon,
  deleteCoupon,
} from "../services/couponService.js";

import { protect, allowedTo } from "../services/authService.js";
import {
  getCouponValidator,
  createCouponValidator,
  updateCouponValidator,
  deleteCouponValidator,
} from "../utils/validators/couponValidator.js";

const router = express.Router();

// Protect all routes after this middleware
router.use(protect, allowedTo("admin", "manager"));

// http://localhost:8000/api/v1/Coupons
router.route("/").get(getCoupons).post(createCouponValidator, createCoupon);
router
  .route("/:id")
  .get(getCouponValidator, getCoupon)
  .put(updateCouponValidator, updateCoupon)
  .delete(allowedTo("admin"), deleteCouponValidator, deleteCoupon);

export default router;
