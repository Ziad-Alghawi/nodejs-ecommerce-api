import asyncHandler from "express-async-handler";

import User from "../models/userModel.js";

// @desc Add a product to wishlist
// @route POST /api/v1/wishlist
// @access Protected/user
export const addProductToWishlist = asyncHandler(async (req, res, next) => {
  // $addToSet >> add productId to wishlist array if productId doesn't exist already
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $addToSet: { wishlist: req.body.productId },
    },
    { new: true },
  );
  res.status(200).json({
    status: "success",
    message: "Product added to wishlist successfully",
    data: user.wishlist,
  });
});

// @desc Remove a product from wishlist
// @route Delete /api/v1/wishlist/:productId
// @access Protected/user
export const removeProductFromWishlist = asyncHandler(
  async (req, res, next) => {
    // $pull >> remove productId from wishlist array if productId exist already
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $pull: { wishlist: req.params.productId },
      },
      { new: true },
    );
    res.status(200).json({
      status: "success",
      message: "Product removed from wishlist successfully",
      data: user.wishlist,
    });
  },
);

// @desc Get logged user wishlist
// @route Get /api/v1/wishlist
// @access Protected/user
export const getLoggedUserWishlist = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate("wishlist");

  res.status(200).json({
    status: "success",
    results: user.wishlist.length,
    data: user.wishlist,
  });
});
