import express from "express";
import { searchCustomer, editOneCustomer } from "../../controller/staff/user.js";

const staffUserRouter = express.Router();

staffUserRouter.get("/search", searchCustomer);
staffUserRouter.put("/edit/:id", editOneCustomer);

export default staffUserRouter;
