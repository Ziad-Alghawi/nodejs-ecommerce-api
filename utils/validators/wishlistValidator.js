import { check } from "express-validator";
import validatorMiddleware from "../../middlewares/validatorMiddleware.js";
import Product from "../../models/productModel.js";

export const addToWishlistValidator = [
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
  validatorMiddleware,
];

export const removeFromWishlistValidator = [
  check("productId").isMongoId().withMessage("Invalid product ID format"),
  validatorMiddleware,
];
