import asyncHandler from "express-async-handler";
import ApiError from "../utils/apiError.js";

import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";

// Helper function to calculate total cart price
const calcTotalCartPrice = (cart) => {
  let totalPrice = 0;
  cart.cartItems.forEach((item) => {
    totalPrice += item.price * item.quantity;
  });
  cart.totalCartPrice = totalPrice;

  return totalPrice;
};

// @desc Add product to cart
// @route POST /api/v1/cart
// @access Private/User
export const addProductToCart = asyncHandler(async (req, res, next) => {
  const { productId, color } = req.body;
  const product = await Product.findById(productId);

  // 1- Get Cart for logged user
  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    // Create cart for logged user with product
    cart = await Cart.create({
      user: req.user._id,
      cartItems: [
        {
          product: productId,
          color,
          price: product.price,
        },
      ],
    });
  } else {
    // Product exist in cart => ((update product quantity))
    const productIndex = cart.cartItems.findIndex(
      (item) => item.product.toString() === productId && item.color === color,
    );
    if (productIndex > -1) {
      const cartItem = cart.cartItems[productIndex];
      cartItem.quantity += 1;

      cart.cartItems[productIndex] = cartItem;
    } else {
      // Product not exist in cart => ((push product to cartItems array))
      cart.cartItems.push({ product: productId, color, price: product.price });
    }
  }

  // Calculate total cart price

  calcTotalCartPrice(cart);

  await cart.save();

  res.status(200).json({
    status: "success",
    message: "Product added to cart successfully",
    data: cart,
  });
});
