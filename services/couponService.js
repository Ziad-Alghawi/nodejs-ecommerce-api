import * as factory from "./handlersFactory.js";

import Coupon from "../models/couponModel.js";

// @desc Get list of coupons
// @route GET /api/v1/coupons
// @access Private/Admin-Manager
export const getCoupons = factory.getAll(Coupon);

//@desc Get a specific
// @route GET /api/v1/coupons/:id
// @access Private/Admin-Manager
export const getCoupon = factory.getOne(Coupon);

// @desc Create a new coupon
// @route POST /api/v1/coupons
// @access Private/Admin-Manager
export const createCoupon = factory.createOne(Coupon);

//@desc  Update a specific
// @route PUT /api/v1/coupons/:id
// @access Private/Admin-Manager
export const updateCoupon = factory.updateOne(Coupon);

//@desc  Delete a specific
// @route DELETE /api/v1/coupons/:id
// @access Private
export const deleteCoupon = factory.deleteOne(Coupon);
