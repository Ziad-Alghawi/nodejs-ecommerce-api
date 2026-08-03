import asyncHandler from "express-async-handler";
import * as factory from "./handlersFactory.js";
import ApiError from "../utils/apiError.js";

import Order from "../models/orderModel.js";
import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";

// @desc   Create Cash Order
// @route  POST /api/v1/orders/cartId
// @access Private/User
export const createCashOrder = asyncHandler(async (req, res, next) => {
  // app settings
  const taxPrice = 0;
  const shippingPrice = 0;

  // 1- Get cart based on cartId
  const cart = await Cart.findById(req.params.cartId);
  if (!cart) {
    return next(
      new ApiError(`No cart found with this id: ${req.params.cartId}`, 404),
    );
  }

  // 2- Get order price based on cart price (check if coupon applied)
  const cartPrice = cart.totalPriceAfterDiscount
    ? cart.totalPriceAfterDiscount
    : cart.totalCartPrice;

  const totalOrderPrice = cartPrice + taxPrice + shippingPrice;

  // 3- Create order with default payment method (cash)
  const order = await Order.create({
    user: req.user._id,
    cartItems: cart.cartItems,
    shippingAddress: req.body.shippingAddress,
    totalOrderPrice,
  });
  // 4- After creating order,>> a(decrement product quantity), b(increment product sold)
  if (order) {
    const bulkOption = cart.cartItems.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { quantity: -item.quantity, sold: +item.quantity } },
      },
    }));
    await Product.bulkWrite(bulkOption, {});

    // 5- Clear cart based on cartId
    await Cart.findByIdAndDelete(req.params.cartId);
  }

  res.status(201).json({ status: "success", data: order });
});

// @desc   Filter Get all orders for logged user
export const filterOrderForLoggedUser = asyncHandler(async (req, res, next) => {
  if (req.user.role === "user") req.filterObj = { user: req.user._id };
  next();
});

// @desc   Get all orders
// @route  GET /api/v1/orders
// @access Private/User-Admin-Manager
export const findAllOrders = factory.getAll(Order);

// @desc   Filter Get specific order for logged user
export const filterOrderForGetOne = (req) =>
  req.user.role === "user" ? { user: req.user._id } : {};

// @desc   Get Specific order by id
// @route  GET /api/v1/orders/:id
// @access Private/User-Admin-Manager
// Users can access only their orders >> admins/managers can access any
export const findSpecificOrder = factory.getOne(
  Order,
  null,
  filterOrderForGetOne,
);

// @desc   Update order paid status to paid
// @route  PUT /api/v1/orders/:id/pay
// @access Private/Admin-Manager
export const updateOrderToPaid = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(
      new ApiError(`No order found with this ID: ${req.params.id}`, 404),
    );
  }

  // Update order to paid
  order.isPaid = true;
  order.paidAt = Date.now();

  const updatedOrder = await order.save();

  res.status(200).json({ status: "success", data: updatedOrder });
});

// @desc   Update order delivered status to delivered
// @route  PUT /api/v1/orders/:id/deliver
// @access Private/Admin-Manager
export const updateOrderToDelivered = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(
      new ApiError(`No order found with this ID: ${req.params.id}`, 404),
    );
  }

  // Update order to delivered
  order.isDelivered = true;
  order.deliveredAt = Date.now();

  const updatedOrder = await order.save();

  res.status(200).json({ status: "success", data: updatedOrder });
});
