import Orders from "../model/orderModel.js";

export const createOrder = (data) => Orders.create(data);

export const getOrderById = (id) =>
  Orders.findById(id).populate("user_id", "username email userphone");

export const getOrdersByUser = (userId) =>
  Orders.find({ user_id: userId }).sort({ createdAt: -1 });

export const getAllOrders = (page = 1, pageSize = 20) =>
  Orders.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize);

export const countOrders = () => Orders.countDocuments();

export const updateOrderPayment = (id, { paymentStatus, transactionId }) =>
  Orders.findByIdAndUpdate(id, { paymentStatus, transactionId }, { new: true });

export const updateOrderStatus = (id, paymentStatus) =>
  Orders.findByIdAndUpdate(id, { paymentStatus }, { new: true });