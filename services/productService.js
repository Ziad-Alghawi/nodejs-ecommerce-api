import sharp from "sharp";
import asyncHandler from "express-async-handler";
import { v4 as uuidv4 } from "uuid";

import { uploadMixOfImages } from "../middlewares/uploadImageMiddleware.js";

import * as factory from "./handlersFactory.js";
import Product from "../models/productModel.js";

// .fields>> we use it for single image and multiple images in the same request
export const uploadProductImage = uploadMixOfImages([
  {
    name: "imageCover",
    maxCount: 1,
  },
  {
    name: "images",
    maxCount: 5,
  },
]);

export const resizeProductImages = asyncHandler(async (req, res, next) => {
  // 1- image processing for imageCover
  if (req.files && req.files.imageCover) {
    const imageCoverFileName = `product-${uuidv4()}-${Date.now()}-cover.jpeg`;

    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat("jpeg")
      .jpeg({ quality: 95 })
      .toFile(`uploads/products/${imageCoverFileName}`);

    // save image into our db
    req.body.imageCover = imageCoverFileName;
  }
  // 2- image processing for images
  if (req.files && req.files.images) {
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (img, index) => {
        const imageName = `product-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;

        await sharp(img.buffer)
          .resize(2000, 1333)
          .toFormat("jpeg")
          .jpeg({ quality: 95 })
          .toFile(`uploads/products/${imageName}`);

        // save image into our db
        req.body.images.push(imageName);
      }),
    );
  }
  next();
});

// @desc Get list of products
// @route GET /api/v1/products
// @access Public
export const getProducts = factory.getAll(Product, "Product");

//@desc get a specific product by id
// @route GET /api/v1/products/:id
// @access Public
export const getProduct = factory.getOne(Product, "reviews");

// @desc Create a new product
// @route POST /api/v1/products
// @access Private
export const createProduct = factory.createOne(Product);

//@desc  update a specific product by id
// @route PUT /api/v1/products/:id
// @access Private
export const updateProduct = factory.updateOne(Product);

//@desc  Delete a specific product by id
// @route DELETE /api/v1/products/:id
// @access Private
export const deleteProduct = factory.deleteOne(Product);
