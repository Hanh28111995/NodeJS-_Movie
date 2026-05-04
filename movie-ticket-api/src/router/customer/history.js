import express from "express";
import { getMyTicketHistory } from "../../controller/customer/history.js";

const customerHistoryRouter = express.Router();

customerHistoryRouter.get("/tickets", getMyTicketHistory);

export default customerHistoryRouter;