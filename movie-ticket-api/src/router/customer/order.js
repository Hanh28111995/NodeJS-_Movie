import { Router } from "express";
import * as orderController from "../../controller/customer/order.js";
const customerOrderRouter = Router();
customerOrderRouter.post("/create", orderController.createOrder);
customerOrderRouter.get("/my", orderController.getMyOrders);
customerOrderRouter.get("/:id", orderController.getOrderDetail);
export default customerOrderRouter;