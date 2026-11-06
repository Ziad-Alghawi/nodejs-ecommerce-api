import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { SENSITIVE_USER_FIELDS } from "../utils/sanitizeData.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "User name is required"],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, "User email is required"],
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
    },
    profileImage: {
      type: String,
    },
    password: {
      type: String,
      required: [true, "User password is required"],
      minlength: [6, "Too short user password"],
      select: false,
    },

    passwordChangedAt: { type: Date, select: false },
    passwordResetCode: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    passwordResetVerified: { type: Boolean, select: false },

    role: {
      type: String,
      enum: ["user", "manager", "admin"],
      default: "user",
    },
    active: {
      type: Boolean,
      default: true,
    },

    // Child reference (1 to many)
    wishlist: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
      },
    ],
    addresses: [
      {
        id: { type: mongoose.Schema.ObjectId },
        alias: String,
        details: String,
        phone: String,
        city: String,
        postalCode: String,
      },
    ],
  },
  {
    timestamps: true,
    // select: false does not cover User.create() or ?fields=+password
    toJSON: {
      transform: (doc, ret) => {
        SENSITIVE_USER_FIELDS.forEach((field) => delete ret[field]);
        return ret;
      },
    },
  },
);

userSchema.pre("save", async function () {
  // Only hash the password if it was modified
  if (!this.isModified("password")) return;

  // Hash the password before saving it to the database
  this.password = await bcrypt.hash(this.password, 12);
});

const User = mongoose.model("User", userSchema);

export default User;
