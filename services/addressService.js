import asyncHandler from "express-async-handler";

import User from "../models/userModel.js";

// @desc Add an address to user addresses
// @route POST /api/v1/addresses
// @access Protected/user
export const addAddress = asyncHandler(async (req, res, next) => {
  // $addToSet >> add address object to user addresses array if it doesn't exist already
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $addToSet: { addresses: req.body },
    },
    { new: true },
  );
  res.status(200).json({
    status: "success",
    message: "Address added successfully",
    data: user.addresses,
  });
});

// @desc Remove an address from user addresses list
// @route Delete /api/v1/addresses/:addressId
// @access Protected/user
export const removeAddress = asyncHandler(async (req, res, next) => {
  // $pull >> remove address from user addresses array if addressId exists
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $pull: { addresses: { _id: req.params.addressId } },
    },
    { new: true },
  );
  res.status(200).json({
    status: "success",
    message: "Address removed successfully",
    data: user.addresses,
  });
});

// @desc Get logged user addresses list
// @route Get /api/v1/addresses
// @access Protected/user
export const getLoggedUserAdresses = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate("addresses");

  res.status(200).json({
    status: "success",
    results: user.addresses.length,
    data: user.addresses,
  });
});
