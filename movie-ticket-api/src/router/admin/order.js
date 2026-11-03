import { Router } from "express";
import * as orderController from "../../controller/admin/order.js";

const adminOrderRouter = Router();
adminOrderRouter.get("/revenue", orderController.getRevenue);
adminOrderRouter.get("/all", orderController.getAllOrders);
adminOrderRouter.put("/:id/status", orderController.updateOrderStatus);
export default adminOrderRouter;