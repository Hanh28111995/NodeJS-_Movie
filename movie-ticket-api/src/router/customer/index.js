import express from "express";



const customerRouter = express.Router();

customerRouter.use("/myticket", customerTicketRouter);

export default adminRouter;
