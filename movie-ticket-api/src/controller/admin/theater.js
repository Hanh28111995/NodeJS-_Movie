import {
  sendServerError,
  sendSuccess,
  sendError,
} from "../../helper/client.js";
import { generateSeats } from "../../helper/generateSeats.js";
import Movies from "../../model/movieModel.js";
import Theater from "../../model/theaterList.js";
import Theater from "../../model/theaterList.js";
import Theater from "../../model/theaterList.js";
import { submitNewMovie } from "../../validation/index.js";

export const addTheater = async (req, res) => {
  try {
    // const validate = submitNewMovie(req.body);
    // if (validate) return sendError(res, 'required fields are missing or invalid');
    const row = req.body.totalSeat.rows || 0;
    const col = req.body.totalSeat.cols || 0;

    generateSeats(row, col).then((seats) => {
      req.body.seats = seats;
    });

    const newTheater = await Theater.create(req.body);
    return sendSuccess(res, "Theater added successfully", newTheater);
  } catch (err) {
    console.log(err);
    return sendServerError(res);
  }
};

export const updateTheater = async (req, res) => {
  try {
    const { id } = req.params;
    // const validate = submitNewMovie(req.body);
    // if (validate) return sendError(res, 'required fields are missing or invalid');
    const updatedTheater = await Theater.findByIdAndUpdate(id, req.body);
    if (!updatedTheater) return sendError(res, "Theater not found");
    return sendSuccess(res, "Theater updated successfully");
  } catch (err) {
    console.log(err);
    return sendServerError(res);
  }
};

export const deleteTheater = async (req, res) => {
  try {
    const { id } = req.params;
    const dTheater = await Theater.findById(id);
    if (!dTheater) {
      return sendError(res, "Theater not found");
    }
    const deletedTheater = await Theater.findByIdAndDelete(movieid);
    return sendSuccess(res, "Theater deleted successfully");
  } catch (err) {
    console.log(err);
    sendServerError(res);
  }
};
