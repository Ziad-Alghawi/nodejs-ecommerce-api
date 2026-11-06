import { check } from "express-validator";
import validatorMiddleware from "../../middlewares/validatorMiddleware.js";

const shippingAddressRules = ["details", "phone", "city", "postalCode"].map(
  (field) =>
    check(`shippingAddress.${field}`)
      .optional()
      .isString()
      .withMessage(`Shipping ${field} must be a string`),
);

export const createOrderValidator = [
  check("cartId").isMongoId().withMessage("Invalid cart ID format"),
  ...shippingAddressRules,
  validatorMiddleware,
];

export const orderIdValidator = [
  check("id").isMongoId().withMessage("Invalid order ID format"),
  validatorMiddleware,
];
