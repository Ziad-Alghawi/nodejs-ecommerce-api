import * as factory from "./handlersFactory.js";

import Review from "../models/reviewModel.js";

// Nested Route for (Get Reviews)
// Get /api/v1/products/:productId/reviews
export const createFilterObject = (req, res, next) => {
  let filterObj = {};
  if (req.params.productId) filterObj = { product: req.params.productId };
  req.filterObj = filterObj;
  next();
};

// @desc Get list of reviews
// @route GET /api/v1/reviews
// @access Public
export const getReviews = factory.getAll(Review);

//@desc get a specific review by id
// @route GET /api/v1/reviews/:id
// @access Public

export const getReview = factory.getOne(Review);

// Nested Route for (Create Review)
// Set the logged-in user as the review owner
export const setProductIdAndUserIdToBody = (req, res, next) => {
  if (!req.body.product) req.body.product = req.params.productId;
  // Set the user ID to the logged-in user's ID
  req.body.user = req.user._id;
  next();
};

// @desc Create a new review
// @route POST /api/v1/reviews
// @access Private/Protect/User
export const createReview = factory.createOne(Review);

// Ignore any user field sent by the client and use the authenticated user instead
export const removeUserFromBody = (req, res, next) => {
  delete req.body.user;
  next();
};

//@desc  update a specific review by id
// @route PUT /api/v1/reviews/:id
// @access Private/Protect/User
export const updateReview = factory.updateOne(Review);

//@desc  Delete a specific review by id
// @route DELETE /api/v1/reviews/:id
// @access Private/Protect/User-Admin-Manager
export const deleteReview = factory.deleteOne(Review);
