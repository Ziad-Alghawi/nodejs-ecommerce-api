import sharp from 'sharp';
import asyncHandler from "express-async-handler";
import { v4 as uuidv4 } from "uuid";

import * as factory from "./handlersFactory.js";
import { uploadSingleImage} from "../middlewares/uploadImageMiddleware.js";


import Brand from "../models/brandModel.js";


// uplosad single image
export const uploadBrandImage = uploadSingleImage("image");

// image processing
export const resizeImage = asyncHandler(async (req, res, next) => {
  if (!req.file) return next();

  const filename = `brand-${uuidv4()}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
  .resize(800, 800)
  .toFormat("jpeg")
  .jpeg({quality: 95})
  .toFile(`uploads/brands/${filename}`);

  // save image into our db
  req.body.image = filename;

  next();
});

// @desc Get list of brands
// @route GET /api/v1/brands
// @access Public
export const getBrands = factory.getAll(Brand);

//@desc get a specific brand by id
// @route GET /api/v1/brands/:id
// @access Public

export const getBrand = factory.getOne(Brand);

// @desc Create a new brand
// @route POST /api/v1/brands
// @access Private
export const createBrand = factory.createOne(Brand);

//@desc  update a specific brand by id
// @route PUT /api/v1/brands/:id
// @access Private
export const updateBrand = factory.updateOne(Brand);

//@desc  Delete a specific brand by id
// @route DELETE /api/v1/brands/:id
// @access Private
export const deleteBrand = factory.deleteOne(Brand);
