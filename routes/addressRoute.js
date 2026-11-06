import express from "express";

import {
  addAddress,
  removeAddress,
  getLoggedUserAdresses,
} from "../services/addressService.js";

import { protect, allowedTo } from "../services/authService.js";
import {
  addAddressValidator,
  removeAddressValidator,
} from "../utils/validators/addressValidator.js";

const router = express.Router();

router.use(protect, allowedTo("user"));

router
  .post("/", addAddressValidator, addAddress)
  .get("/", getLoggedUserAdresses);

// http://localhost:8000/api/v1/addresses
router.delete("/:addressId", removeAddressValidator, removeAddress);

export default router;
