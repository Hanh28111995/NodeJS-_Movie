import SeatType from "../../model/seatTypeModel";
import { submitSeatType } from "../../validation";

export const getSeatType = async (req, res) => {
    try {
        const seatTypes =  await SeatType.find();
        return sendSuccess(res, "All seat types retrieved successfully", seatTypes);
    } catch (err) {
        console.log(err);
        return sendServerError(res);
    }
};

export const addSeatType = async (req, res) => {
  try {
    const validate = submitSeatType(req.body);
    if (validate)
      return sendError(res, "required fields are missing or invalid");
      const newSeatType = await SeatType.create(req.body);
    return sendSuccess(res, "SeatType added successfully",newSeatType);
  } catch (err) {
    console.log(err);
    return sendServerError(res);
  }
};

export const updateSeatType = async (req, res) => {
  try {
    const { id } = req.params;
    const validate = submitSeatType(req.body);
    if (validate)
      return sendError(res, "required fields are missing or invalid");
    const updatedSeatType = await SeatType.findByIdAndUpdate(id, req.body);
    if (!updatedSeatType) return sendError(res, "SeatType not found");
    return sendSuccess(res, "SeatType updated successfully", updatedSeatType);
  } catch (err) {
    console.log(err);
    return sendServerError(res);
  }
};

export const deleteSeatType = async (req, res) => {
  try {
    const { id } = req.params;
    const newSeatType = await SeatType.findById(id);
    if (!newSeatType) {
      return sendError(res, "SeatType not found");
    }
    const deletedSeatType = await SeatType.findByIdAndDelete(id);
    return sendSuccess(res, "Movie deleted successfully");
  } catch (err) {
    console.log(err);
    sendServerError(res);
  }
};