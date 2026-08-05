import slugify from "slugify";
import { check, body } from "express-validator";
import bcrypt from "bcryptjs";

import validatorMiddleware from "../../middlewares/validatorMiddleware.js";
import User from "../../models/userModel.js";

export const createUserValidator = [
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
    .custom(async (val) => {
      const user = await User.findOne({ email: val });
      if (user) {
        return Promise.reject(new Error("E-mail already in use"));
      }
      return true;
    }),

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

  check("phone")
    .optional()
    .isMobilePhone("de-DE")
    .withMessage("Invalid phone number only accepted German numbers "),

  check("profileImage").optional(),

  check("role").optional(),

  validatorMiddleware,
];

export const getUserValidator = [
  //Rule number 1 to check if the id is a valid MongoDB ObjectId
  check("id").isMongoId().withMessage("Invalid User ID format"),
  validatorMiddleware,
];

export const updateUserValidator = [
  check("id").isMongoId().withMessage("Invalid User ID format"),
  body("name")
    .optional()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),

  check("email")
    .notEmpty()
    .withMessage("User email required")
    .isEmail()
    .withMessage("Invalid email format")
    .custom(async (val, { req }) => {
      const user = await User.findOne({ email: val });
      if (user && user._id.toString() !== req.params.id) {
        return Promise.reject(new Error("E-mail already in use"));
      }
      return true;
    }),

  check("phone")
    .optional()
    .isMobilePhone("de-DE")
    .withMessage("Invalid phone number only accepted German numbers "),

  check("profileImage").optional(),

  check("role").optional(),

  validatorMiddleware,
];

// Change user password validator (for admin only)
export const changeUserPasswordValidator = [
  check("id").isMongoId().withMessage("Invalid User ID format"),

  body("currentPassword")
    .notEmpty()
    .withMessage("You must enter your current password"),
  body("passwordConfirm")
    .notEmpty()
    .withMessage("You must enter your password confirmation"),
  body("password")
    .notEmpty()
    .withMessage("You must enter your new password")

    .custom(async (val, { req }) => {
      // 1- Verify the current password
      const user = await User.findById(req.params.id);
      if (!user) {
        throw new Error("There is no user for this id");
      }
      const isCorrectPassword = await bcrypt.compare(
        req.body.currentPassword,
        user.password,
      );
      if (!isCorrectPassword) {
        throw new Error("Incorrect current password");
      }

      // 2- Verify the password confirmation
      if (val !== req.body.passwordConfirm) {
        throw new Error("Password confirmation does not match password");
      }
      return true;
    }),
  validatorMiddleware,
];

// Delete user validator (for admin only)
export const deleteUserValidator = [
  check("id").isMongoId().withMessage("Invalid User ID format"),
  validatorMiddleware,
];

// Change logged user password validator (for logged in user only)
export const changeLoggedUserPasswordValidator = [
  body("currentPassword")
    .notEmpty()
    .withMessage("You must enter your current password"),
  body("passwordConfirm")
    .notEmpty()
    .withMessage("You must enter your password confirmation"),
  body("password")
    .notEmpty()
    .withMessage("You must enter your new password")

    .custom(async (val, { req }) => {
      // 1- Verify the current password
      const user = await User.findById(req.user._id);
      if (!user) {
        throw new Error("There is no user for this id");
      }
      const isCorrectPassword = await bcrypt.compare(
        req.body.currentPassword,
        user.password,
      );
      if (!isCorrectPassword) {
        throw new Error("Incorrect current password");
      }

      // 2- Verify the password confirmation
      if (val !== req.body.passwordConfirm) {
        throw new Error("Password confirmation does not match password");
      }
      return true;
    }),
  validatorMiddleware,
];

// Update logged user validator (for logged in user only)
export const updateLoggedUserValidator = [
  body("name")
    .optional()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),

  check("email")
    .notEmpty()
    .withMessage("User email required")
    .isEmail()
    .withMessage("Invalid email format")
    .custom(async (val, { req }) => {
      const user = await User.findOne({ email: val });
      if (user && user._id.toString() !== req.user._id.toString()) {
        return Promise.reject(new Error("E-mail already in use"));
      }
      return true;
    }),

  check("phone")
    .optional()
    .isMobilePhone("de-DE")
    .withMessage("Invalid phone number only accepted German numbers "),

  validatorMiddleware,
];
