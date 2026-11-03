import mongoose from "mongoose";
import FavoriteUsers from "../../model/favoriteUserModel.js";
import InforTicket from "../../model/inforTicketModel.js";
import Notification from "../../model/userCartNotificationModel.js";
import Orders from "../../model/orderModel.js";
import Payments from "../../model/paymentModel.js";
import { createGatewayUrl } from "./cartPaymentGateway.js";

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const paymentMethods = ["MOMO", "VNPAY", "CASH"];
const allowedTypes = ["ticket", "order"];

const normalizeSelectedItems = (items) => {
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    throw createError("selectedItems phải có từ 1 đến 50 mục", 400);
  }
  const seen = new Set();
  return items.map((item) => {
    if (!allowedTypes.includes(item?.type) || !mongoose.isValidObjectId(item?.id)) {
      throw createError("Mỗi mục cần có type ticket/order và id hợp lệ", 400);
    }
    const key = `${item.type}:${item.id}`;
    if (seen.has(key)) throw createError("Danh sách có mục bị trùng", 400);
    seen.add(key);
    return { type: item.type, id: new mongoose.Types.ObjectId(item.id) };
  });
};

const getTicketAmount = (ticket) => {
  if (!Array.isArray(ticket.seatName)) return 0;
  return ticket.seatName.reduce((sum, seat) => {
    const price = Number(seat?.price);
    return sum + (Number.isFinite(price) && price >= 0 ? price : 0);
  }, 0);
};

const ensureInCart = (cart, selectedItems) => {
  for (const item of selectedItems) {
    const inCart = cart.some((cartItem) =>
      item.type === "ticket"
        ? String(cartItem.ticket_id) === String(item.id)
        : String(cartItem.order_id) === String(item.id),
    );
    if (!inCart) throw createError("Có mục được chọn không còn trong giỏ hàng", 409);
  }
};

const reserveItem = async (item, userId, paymentId) => {
  const Model = item.type === "ticket" ? InforTicket : Orders;
  const result = await Model.updateOne(
    {
      _id: item.id,
      user_id: userId,
      paymentStatus: "Pending",
      payment_id: { $exists: false },
    },
    { $set: { payment_id: paymentId } },
  );
  if (result.modifiedCount !== 1) {
    throw createError(
      "Có mục không còn chờ thanh toán hoặc đã được checkout ở nơi khác",
      409,
    );
  }
};

const releaseReservation = async (payment) => {
  const ticketIds = payment.items
    .filter((item) => item.type === "ticket")
    .map((item) => item.item_id);
  const orderIds = payment.items
    .filter((item) => item.type === "order")
    .map((item) => item.item_id);
  await Promise.all([
    ticketIds.length
      ? InforTicket.updateMany(
          { _id: { $in: ticketIds }, payment_id: payment._id, paymentStatus: "Pending" },
          { $unset: { payment_id: 1 } },
        )
      : null,
    orderIds.length
      ? Orders.updateMany(
          { _id: { $in: orderIds }, payment_id: payment._id, paymentStatus: "Pending" },
          { $unset: { payment_id: 1 } },
        )
      : null,
  ]);
};

const removeItemsFromCart = async (payment) => {
  const ticketIds = payment.items
    .filter((item) => item.type === "ticket")
    .map((item) => item.item_id);
  const orderIds = payment.items
    .filter((item) => item.type === "order")
    .map((item) => item.item_id);
  const conditions = [];
  if (ticketIds.length) conditions.push({ ticket_id: { $in: ticketIds } });
  if (orderIds.length) conditions.push({ order_id: { $in: orderIds } });
  if (conditions.length) {
    await FavoriteUsers.updateOne(
      { user_id: payment.user_id },
      { $pull: { cart: { $or: conditions } } },
    );
  }
};

const updatePaymentItems = async (payment, transactionId) => {
  const now = new Date();
  const ticketIds = [];
  for (const item of payment.items.filter(({ type }) => type === "ticket")) {
    const updated = await InforTicket.updateOne(
      {
        _id: item.item_id,
        user_id: payment.user_id,
        payment_id: payment._id,
        paymentStatus: "Pending",
      },
      {
        $set: {
          paymentStatus: "Completed",
          paymentMethod:
            payment.paymentMethod === "CASH"
              ? "cash"
              : payment.paymentMethod === "MOMO"
                ? "momo"
                : "internet banking",
          paidAt: now,
        },
      },
    );
    if (updated.modifiedCount === 1) {
      ticketIds.push(item.item_id);
      continue;
    }
    const alreadyCompleted = await InforTicket.exists({
      _id: item.item_id,
      user_id: payment.user_id,
      payment_id: payment._id,
      paymentStatus: "Completed",
    });
    if (!alreadyCompleted) throw createError("Không thể cập nhật trạng thái vé", 409);
  }

  for (const item of payment.items.filter(({ type }) => type === "order")) {
    const updated = await Orders.updateOne(
      {
        _id: item.item_id,
        user_id: payment.user_id,
        payment_id: payment._id,
        paymentStatus: "Pending",
      },
      {
        $set: {
          paymentStatus: "Completed",
          paymentMethod: payment.paymentMethod,
          paidAt: now,
        },
      },
    );
    if (updated.modifiedCount === 1) continue;
    const alreadyCompleted = await Orders.exists({
      _id: item.item_id,
      user_id: payment.user_id,
      payment_id: payment._id,
      paymentStatus: "Completed",
    });
    if (!alreadyCompleted) throw createError("Không thể cập nhật trạng thái đơn hàng", 409);
  }

  if (ticketIds.length) {
    await Notification.updateMany(
      { id_ticket: { $in: ticketIds } },
      {
        $set: {
          ticketStatus: "Completed",
          status: false,
          note: "Payment successful",
        },
      },
    );
  }
};

export const checkoutCartItems = async (userId, selected, method, req) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw createError("Tài khoản không hợp lệ", 401);
  }
  const paymentMethod = String(method || "").toUpperCase();
  if (!paymentMethods.includes(paymentMethod)) {
    throw createError("paymentMethod chỉ hỗ trợ MOMO, VNPAY hoặc CASH", 400);
  }
  const selectedItems = normalizeSelectedItems(selected);
  const profile = await FavoriteUsers.findOne({ user_id: userId }).select("cart");
  if (!profile) throw createError("Không tìm thấy giỏ hàng", 404);
  ensureInCart(profile.cart, selectedItems);

  const paymentItems = [];
  for (const item of selectedItems) {
    const Model = item.type === "ticket" ? InforTicket : Orders;
    const document = await Model.findOne({
      _id: item.id,
      user_id: userId,
      paymentStatus: "Pending",
      payment_id: { $exists: false },
    }).lean();
    if (!document) {
      throw createError("Có mục không tồn tại, không thuộc khách hàng hoặc đã checkout", 409);
    }
    const amount =
      item.type === "ticket"
        ? getTicketAmount(document)
        : Number(document.totalAmount);
    if (!Number.isInteger(amount) || amount <= 0) {
      throw createError("Không xác định được giá thanh toán của một mục", 400);
    }
    paymentItems.push({
      type: item.type,
      item_id: item.id,
      amount,
    });
  }

  const totalAmount = paymentItems.reduce((sum, item) => sum + item.amount, 0);
  const payment = await Payments.create({
    user_id: userId,
    items: paymentItems,
    totalAmount,
    paymentMethod,
  });
  try {
    for (const item of selectedItems) {
      await reserveItem(item, userId, payment._id);
    }
    if (paymentMethod === "CASH") {
      return {
        payment,
        message: "Vui lòng thanh toán tại quầy; nhân viên cần xác nhận giao dịch",
      };
    }

    const paymentUrl = await createGatewayUrl(payment, req);
    return { payment, paymentUrl };
  } catch (error) {
    await releaseReservation({ ...payment.toObject(), items: paymentItems });
    await Payments.updateOne(
      { _id: payment._id, status: "Pending" },
      { $set: { status: "Failed" } },
    );
    throw error;
  }
};

export const getPaymentForUser = async (paymentId, userId) => {
  if (!mongoose.isValidObjectId(paymentId)) {
    throw createError("paymentId không hợp lệ", 400);
  }
  const payment = await Payments.findOne({ _id: paymentId, user_id: userId }).lean();
  if (!payment) throw createError("Không tìm thấy giao dịch", 404);
  return payment;
};

export const completeCartPayment = async (
  paymentId,
  { method, transactionId, amount, staffId },
) => {
  if (!mongoose.isValidObjectId(paymentId)) return null;
  const payment = await Payments.findById(paymentId);
  if (!payment) return null;
  if (payment.status === "Completed") {
    await removeItemsFromCart(payment);
    return payment;
  }
  if (payment.status !== "Pending" || payment.paymentMethod !== method) return null;
  if (Number(amount) !== Math.round(payment.totalAmount)) return null;
  if (!transactionId) return null;
  const reusedTransaction = await Payments.exists({
    transactionId,
    _id: { $ne: payment._id },
  });
  if (reusedTransaction) return null;

  await updatePaymentItems(payment, transactionId);
  const updated = await Payments.findOneAndUpdate(
    { _id: payment._id, status: "Pending", paymentMethod: method },
    {
      $set: {
        status: "Completed",
        transactionId,
        paidAt: new Date(),
        ...(staffId ? { staff_id: staffId } : {}),
      },
    },
    { new: true },
  );
  if (!updated) {
    const latest = await Payments.findById(payment._id);
    if (latest?.status !== "Completed") return null;
    await removeItemsFromCart(latest);
    return latest;
  }
  await removeItemsFromCart(updated);
  return updated;
};

export const failCartPayment = async (paymentId, method) => {
  if (!mongoose.isValidObjectId(paymentId)) return null;
  const payment = await Payments.findOneAndUpdate(
    { _id: paymentId, status: "Pending", paymentMethod: method },
    { $set: { status: "Failed" } },
    { new: true },
  );
  if (payment) await releaseReservation(payment);
  return payment;
};

export const confirmCashCartPayment = async (paymentId, staffId) => {
  if (!mongoose.isValidObjectId(paymentId)) {
    throw createError("paymentId không hợp lệ", 400);
  }
  const payment = await Payments.findById(paymentId);
  if (!payment || payment.paymentMethod !== "CASH") return null;
  return completeCartPayment(paymentId, {
    method: "CASH",
    transactionId: `CASH-${payment.paymentId}`,
    amount: payment.totalAmount,
    staffId,
  });
};

export const getCartPaymentByTransactionRef = (reference) => {
  const paymentId = String(reference || "").replace(/^PAY_/, "");
  if (!mongoose.isValidObjectId(paymentId)) return null;
  return Payments.findById(paymentId);
};
