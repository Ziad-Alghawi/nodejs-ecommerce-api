import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import asyncHandler from "express-async-handler";
import ApiError from "../utils/apiError.js";
import sendEmail from "../utils/sendEmail.js";
import createToken from "../utils/createToken.js";
import { sanitizeUser } from "../utils/sanitizeData.js";

import User from "../models/userModel.js";

// @desc Signup a new user
// @route POST /api/v1/auth/signup
// @access Public
export const signup = asyncHandler(async (req, res) => {
  // 1- Create user
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password, // no need to hash it cuz we already hashed it in the userModel using pre save middleware
  });

  // 2- Generate token
  const token = createToken(user._id);

  res.status(201).json({ data: sanitizeUser(user), token });
});

// @desc Login a user
// @route POST /api/v1/auth/login
// @access Public
export const login = asyncHandler(async (req, res, next) => {
  // 1- check if email and password in the request body
  // 2- check if user exists & password is correct
  const user = await User.findOne({ email: req.body.email }).select("+password");
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return next(new ApiError("Incorrect email or password", 401));
  }
  // 3- generate token
  const token = createToken(user._id);

  // 4- send response to client side
  res.status(200).json({ data: sanitizeUser(user), token });
});

// @desc Make sure the user is logged in and protect the route
export const protect = asyncHandler(async (req, res, next) => {
  // 1- check if token exists >> if exists, get it
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(
      new ApiError(
        "You are not logged in, please login to get access for this route",
        401,
      ),
    );
  }

  // 2- verify token (no changes happened on it -- and not expired)
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  // 3- check if user exists
  const currentUser = await User.findById(decoded.userId).select(
    "+passwordChangedAt",
  );
  if (!currentUser) {
    return next(
      new ApiError(
        "The user belonging to this token does no longer exist",
        401,
      ),
    );
  }
  // 4- check if user changed password after token was issued
  if (currentUser.passwordChangedAt) {
    const passwordChangedTimestamp = parseInt(
      currentUser.passwordChangedAt.getTime() / 1000,
      10,
    );
    //Password changed after token was issued
    if (passwordChangedTimestamp > decoded.iat) {
      return next(
        new ApiError("User recently changed password! Please login again", 401),
      );
    }
  }
  req.user = currentUser; // add user data to request object
  next();
});

// @desc Authorization (user permissions)
// ["admin", "manager"]
export const allowedTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    // 1- access roles
    //2- access registered user(req.user.role)
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError("You are not allowed to access this route", 403),
      );
    }
    next();
  });

// @desc Forget password
// @route POST /api/v1/auth/forgotpassword
// @access Public
export const forgotPassword = asyncHandler(async (req, res, next) => {
  // 1- Get user by email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new ApiError(`There is no user with this email ${req.body.email}`, 404),
    );
  }
  // 2- if user exists, Generate (hashed) random 6 digits number (OTP) and save it to DB
  const resetCode = crypto.randomInt(100000, 1000000).toString();
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  // save hashed passwordResetCode to DB
  user.passwordResetCode = hashedResetCode;
  // Set expiration time for the reset code(10 min)
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  user.passwordResetVerified = false;

  await user.save();

  const message = `Hi ${user.name}, \n We received a request to reset your password on your E-shop Account. \n ${resetCode} \n Enter this code to complete the reset. \n Thanks for helping us keep your account secure. \n E-shop Team`;

  // 3- send the reset code via email
  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset code (valid for 10 min)",
      message,
    });
  } catch (err) {
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;
    await user.save();
    return next(
      new ApiError(
        "There is an error in sending email, please try again later",
        500,
      ),
    );
  }

  res.status(200).json({
    status: "success",
    message: "Reset code sent to email",
  });
});

// @desc Verify password reset code
// @route POST /api/v1/auth/verifyResetCode
// @access Public
export const verifyPassResetCode = asyncHandler(async (req, res, next) => {
  // 1 - Get user based on the reset code
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(req.body.resetCode)
    .digest("hex");

  const user = await User.findOne({
    passwordResetCode: hashedResetCode,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new ApiError("Reset code is invalid or has expired", 400));
  }

  // 2- Reset code is valid
  user.passwordResetVerified = true;
  await user.save();

  res.status(200).json({
    status: "success",
  });
});

// @desc Reset password
// @route POST /api/v1/auth/resetpassword
// @access Public
export const resetPassword = asyncHandler(async (req, res, next) => {
  // 1- Get user based on the email
  const user = await User.findOne({
    email: req.body.email,
  }).select("+passwordResetVerified");
  if (!user) {
    return next(
      new ApiError(`There is no user with this email ${req.body.email}`, 404),
    );
  }
  // 2- Check if the reset code is verified
  if (!user.passwordResetVerified) {
    return next(new ApiError("Reset code not verified", 400));
  }

  user.password = req.body.newPassword;
  user.passwordChangedAt = Date.now(); // invalidate tokens issued before the reset
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetVerified = undefined;
  await user.save();

  // 3- If everything is ok > |Generate token
  const token = createToken(user._id);
  res.status(200).json({
    status: "success",
    token,
  });
});
