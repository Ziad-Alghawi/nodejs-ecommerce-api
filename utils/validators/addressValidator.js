import { check } from "express-validator";
import validatorMiddleware from "../../middlewares/validatorMiddleware.js";

const optionalString = (field) =>
  check(field).optional().isString().withMessage(`${field} must be a string`);

export const addAddressValidator = [
  optionalString("alias"),
  optionalString("details"),
  optionalString("phone"),
  optionalString("city"),
  optionalString("postalCode"),
  validatorMiddleware,
];

export const removeAddressValidator = [
  check("addressId").isMongoId().withMessage("Invalid address ID format"),
  validatorMiddleware,
];
