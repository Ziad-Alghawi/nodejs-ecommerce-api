// To return only what is necessary

export const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
});

export const sanitizeOrder = (order) => ({
  _id: order._id,
  totalOrderPrice: order.totalOrderPrice,
  paymentMethodType: order.paymentMethodType,
  isPaid: order.isPaid,
  isDelivered: order.isDelivered,
  createdAt: order.createdAt,
});

// export const sanitizeCart = (cart) => ({
//   _id: cart._id,
//   cartItems: cart.cartItems,
//   totalCartPrice: cart.totalCartPrice,
//   totalPriceAfterDiscount: cart.totalPriceAfterDiscount,
// });
