import {
  sendServerError,
  sendSuccess,
  sendError,
} from "../../helper/client.js";
import Cinema from "../../model/cinemaModel.js";



export const addCinema = async (req, res) => {
  try {
    // const validate = submitNewMovie(req.body);
    // if (validate) return sendError(res, 'required fields are missing or invalid');
    const newCinema = await Cinema.create(req.body);
    return sendSuccess(res, "Cinema added successfully", newCinema);
  } catch (err) {    
    console.log(err);
    return sendServerError(res);
  }
};

export const updateCinema = async (req, res) => {
  try {
    const { cinemaId } = req.params;
    // const validate = submitNewMovie(req.body);
    // if (validate) return sendError(res, 'required fields are missing or invalid');
    const updatedCinema = await Cinema.findByIdAndUpdate(cinemaId, req.body);
    if (!updatedCinema) return sendError(res, "Cinema not found");
    return sendSuccess(res, "Cinema updated successfully", updatedCinema);
  } catch (err) {
    console.log(err);
    return sendServerError(res);
  }
};

export const deleteCinema = async (req, res) => {
  try {
    const { cinemaId } = req.params;
    const Cinema = await Cinema.findById(id);
    if (!Cinema) {
        return sendError(res, "Cinema not found");
    }
    const deletedCinema = await Cinema.findByIdAndDelete(cinemaId);
    return sendSuccess(res, "Cinema deleted successfully");
  } catch (err) {
    console.log(err);
    sendServerError(res);
  }
};


