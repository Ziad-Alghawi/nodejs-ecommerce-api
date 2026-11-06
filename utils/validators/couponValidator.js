import { check } from "express-validator";
import validatorMiddleware from "../../middlewares/validatorMiddleware.js";

const isValidDate = (val) => {
  if (Number.isNaN(Date.parse(val))) {
    throw new Error("Invalid coupon expire date");
  }
  return true;
};

export const getCouponValidator = [
  check("id").isMongoId().withMessage("Invalid Coupon ID format"),
  validatorMiddleware,
];

export const createCouponValidator = [
  check("name")
    .isString()
    .withMessage("Coupon name must be a string")
    .notEmpty()
    .withMessage("Coupon name is required"),
  check("expire")
    .notEmpty()
    .withMessage("Coupon expire date is required")
    .custom(isValidDate),
  check("discount")
    .isFloat({ min: 0, max: 100 })
    .withMessage("Coupon discount must be between 0 and 100"),
  validatorMiddleware,
];

export const updateCouponValidator = [
  check("id").isMongoId().withMessage("Invalid Coupon ID format"),
  check("name")
    .optional()
    .isString()
    .withMessage("Coupon name must be a string"),
  check("expire").optional().custom(isValidDate),
  check("discount")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Coupon discount must be between 0 and 100"),
  validatorMiddleware,
];

export const deleteCouponValidator = [
  check("id").isMongoId().withMessage("Invalid Coupon ID format"),
  validatorMiddleware,
];
