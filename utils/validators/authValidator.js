import slugify from "slugify";
import { check } from "express-validator";

import validatorMiddleware from "../../middlewares/validatorMiddleware.js";
import User from "../../models/userModel.js";

export const signupValidator = [
  check("name")
    .notEmpty()
    .withMessage("User name required")
    .isLength({ min: 3 })
    .withMessage("Too short user name")
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),

  check("email")
    .notEmpty()
    .withMessage("User email required")
    .isEmail()
    .withMessage("Invalid email format")
    .custom((val) =>
      User.findOne({ email: val }).then((user) => {
        if (user) {
          return Promise.reject(new Error("E-mail already in use"));
        }
      }),
    ),

  check("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .custom((password, { req }) => {
      if (password !== req.body.passwordConfirm) {
        throw new Error("Password confirmation does not match password");
      }
      return true;
    }),

  check("passwordConfirm")
    .notEmpty()
    .withMessage("Password confirmation is required"),

  validatorMiddleware,
];

export const loginValidator = [
  check("email")
    .notEmpty()
    .withMessage("User email required")
    .isString()
    .withMessage("Invalid email format")
    .isEmail()
    .withMessage("Invalid email format"),

  check("password")
    .notEmpty()
    .withMessage("Password is required")
    .isString()
    .withMessage("Password must be a string")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  validatorMiddleware,
];

export const forgotPasswordValidator = [
  check("email")
    .isString()
    .withMessage("User email required")
    .isEmail()
    .withMessage("Invalid email format"),

  validatorMiddleware,
];

export const verifyResetCodeValidator = [
  check("resetCode")
    .isString()
    .withMessage("Reset code required")
    .isLength({ min: 6, max: 6 })
    .withMessage("Reset code must be 6 digits"),

  validatorMiddleware,
];

export const resetPasswordValidator = [
  check("email")
    .isString()
    .withMessage("User email required")
    .isEmail()
    .withMessage("Invalid email format"),

  check("newPassword")
    .isString()
    .withMessage("New password required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  validatorMiddleware,
];
