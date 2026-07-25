import express from "express";

import {
  addAddress,
  removeAddress,
  getLoggedUserAdresses,
} from "../services/addressService.js";

import { protect, allowedTo } from "../services/authService.js";

const router = express.Router();

router.use(protect, allowedTo("user"));

router.post("/", addAddress).get("/", getLoggedUserAdresses);

// http://localhost:8000/api/v1/addresses
router.delete("/:addressId", removeAddress);

export default router;
