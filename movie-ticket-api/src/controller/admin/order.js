import * as orderService from "../../service/orderService.js";
import { getRevenueReport } from "../../service/admin/revenueService.js";
import { sendError, sendSuccess } from "../../helper/client.js";
import asyncHandler from "../../util/asyncHandler.js";

export const getRevenue = asyncHandler(async (req, res) => {
  const period = req.query.period || "shift";
  if (!["shift", "week", "month"].includes(period)) {
    return sendError(res, "period chỉ chấp nhận shift, week hoặc month", 400);
  }
  const report = await getRevenueReport(period);
  return sendSuccess(res, "Lấy báo cáo doanh thu thành công", report);
});

export const getAllOrders = (req, res) =>
  orderService.listAllOrders(
    res,
    Number(req.query.page) || 1,
    Number(req.query.pageSize) || 20,
  );

export const updateOrderStatus = (req, res) =>
  orderService.changeOrderStatus(res, req.params.id, req.body.paymentStatus);
