import * as orderService from "../../service/orderService.js";

export const createOrder = (req, res) =>
  orderService.createNewOrder(
    res,
    {
      ...req.body,
      user_id:
        req.user?.role === "customer" ? req.user.id : req.body.user_id,
    },
    { id: req.user?.id, role: req.user?.role },
  );

export const getMyOrders = (req, res) =>
  orderService.getMyOrders(res, req.user?.id || req.body.user_id);

export const getOrderDetail = (req, res) =>
  orderService.getOrderDetail(res, req.params.id);