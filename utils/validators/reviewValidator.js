import { check } from "express-validator";
import validatorMiddleware from "../../middlewares/validatorMiddleware.js";
import Review from "../../models/reviewModel.js";

export const createReviewValidator = [
  check("title").optional(),
  check("ratings")
    .notEmpty()
    .withMessage("Rating is required")
    .isFloat({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  check("user").isMongoId().withMessage("Invalid User ID format"),
  check("product")
    .isMongoId()
    .withMessage("Invalid Product ID format")
    .custom((val, { req }) =>
      // check if the logged user created review before
      Review.findOne({
        user: req.user._id,
        product: req.body.product,
      }).then((review) => {
        if (review) {
          return Promise.reject(
            new Error("You have already created a review before"),
          );
        }
      }),
    ),

  validatorMiddleware,
];

export const getReviewValidator = [
  check("id").isMongoId().withMessage("Invalid Review ID format"),
  validatorMiddleware,
];

export const updateReviewValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid Review ID format")
    .custom((val, { req }) =>
      // check Review owner befor update
      Review.findById(val).then((review) => {
        if (!review) {
          return Promise.reject(
            new Error(`There is no review for this id: ${val}`),
          );
        }

        if (review.user._id.toString() !== req.user._id.toString()) {
          return Promise.reject(
            new Error(`You are not allowed to update this review`),
          );
        }
      }),
    ),
  check("ratings")
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  validatorMiddleware,
];

export const deleteReviewValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid Review ID format")
    .custom((val, { req }) => {
      // check Review owner befor delete
      if (req.user.role === "user") {
        return Review.findById(val).then((review) => {
          if (!review) {
            return Promise.reject(
              new Error(`There is no review for this id: ${val}`),
            );
          }
          if (review.user._id.toString() !== req.user._id.toString()) {
            return Promise.reject(
              new Error(`You are not allowed to delete this review`),
            );
          }
        });
      }
      return true;
    }),

  validatorMiddleware,
];
