import express from "express";
import { getTicketHistory } from "../../controller/staff/history.js";

const staffHistoryRouter = express.Router();

staffHistoryRouter.get("/tickets", getTicketHistory);

export default staffHistoryRouter;