import express from "express";
import {
  signupValidator,
  loginValidator,
  forgotPasswordValidator,
  verifyResetCodeValidator,
  resetPasswordValidator,
} from "../utils/validators/authValidator.js";

import {
  signup,
  login,
  forgotPassword,
  verifyPassResetCode,
  resetPassword,
} from "../services/authService.js";

const router = express.Router();

router.post("/signup", signupValidator, signup);
router.post("/login", loginValidator, login);
router.post("/forgotpassword", forgotPasswordValidator, forgotPassword);
router.post("/verifyResetCode", verifyResetCodeValidator, verifyPassResetCode);
router.put("/resetpassword", resetPasswordValidator, resetPassword);

export default router;
