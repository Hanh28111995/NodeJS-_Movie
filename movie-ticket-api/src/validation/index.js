import Error from "../helper/error.js";



export const submitNewCinema = (data) => {
  const error = new Error();
  error
    .isRequired(data.cinemaName, "cinemaName")
    .isRequired(data.branch, "branch")
    .isRequired(data.address, "address");
  return error.get();
};

export const submitSeatType = (data) => {
  const error = new Error();
  error.isRequired(data.name, "name").isRequired(data.price, "price");
  return error.get();
};



export const submitNewTheater = (data) => {
  const error = new Error();
  error
    .isRequired(data.name, "name")
    .isRequired(data.cinemaName, "cinemaName")
    .isRequired(data.totalSeat, "totalSeat")
    .isRequired(data.description, "description");
  return error.get();
};

export const submitShowtime = (data) => {
  const error = new Error();
  error    
    .isRequired(data.theater, "theater")
    .isRequired(data.id_movie, "id_movie")    
    .isRequired(data.startTime, "startTime");
  return error.get();
};

export const submitNewMovie = (data) => {
  const error = new Error();
  error
    .isRequired(data.trailer, "trailer")
    .isRequired(data.coming, "coming")
    .isRequired(data.title, "title")
    .isRequired(data.describe, "describe")
    .isRequired(data.director, "director")
    .isRequired(data.releaseDate, "releaseDate")
    .isRequired(data.genre, "genre")
    .isRequired(data.duration, "duration");
  return error.get();
};

export const submitNewTicket = (data) => {
  const error = new Error();
  error
    .isRequired(data.id_movie, "id_movie")
    .isRequired(data.startTime, "startTime")
    .isRequired(data.id_theater, "id_theater")
    .isRequired(data.seatName, "seatName")
    .isRequired(data.paymentMethod, "paymentMethod")
    .isRequired(data.transactionId, "transactionId");
  return error.get();
};

export const submitNewUser = (data) => {
  const error = new Error();
  error
    .isRequired(data.username, "username")
    .isRequired(data.password, "password")
    .isRequired(data.email, "email")
    .isRequired(data.role, "role");
  return error.get();
};
