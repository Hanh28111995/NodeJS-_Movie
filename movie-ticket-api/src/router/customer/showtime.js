import express from "express";
import {  
  getShowtimeById,
} from "../../controller/admin/showtime.js";


const customerShowTimeRouter = express.Router();

customerShowTimeRouter.get("/showtimeDetail/:id", getShowtimeById);

export default customerShowTimeRouter;
