import * as orderService from "../../service/orderService.js";

export const getAllOrders = (req, res) =>
  orderService.listAllOrders(res, Number(req.query.page) || 1, Number(req.query.pageSize) || 20);

export const updateOrderStatus = (req, res) =>
  orderService.changeOrderStatus(res, req.params.id, req.body.paymentStatus);