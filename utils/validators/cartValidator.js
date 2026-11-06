import { check } from "express-validator";
import validatorMiddleware from "../../middlewares/validatorMiddleware.js";
import Product from "../../models/productModel.js";

export const addProductToCartValidator = [
  check("productId")
    .isMongoId()
    .withMessage("Invalid product ID format")
    .bail()
    .custom(async (val) => {
      if (!(await Product.exists({ _id: val }))) {
        throw new Error(`No product for this id: ${val}`);
      }
      return true;
    }),
  check("color").optional().isString().withMessage("Color must be a string"),
  validatorMiddleware,
];

export const updateCartItemValidator = [
  check("itemId").isMongoId().withMessage("Invalid cart item ID format"),
  check("quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be a whole number of at least 1"),
  validatorMiddleware,
];

export const removeCartItemValidator = [
  check("itemId").isMongoId().withMessage("Invalid cart item ID format"),
  validatorMiddleware,
];

export const applyCouponValidator = [
  check("coupon")
    .isString()
    .withMessage("Coupon name must be a string")
    .notEmpty()
    .withMessage("Coupon name is required"),
  validatorMiddleware,
];
