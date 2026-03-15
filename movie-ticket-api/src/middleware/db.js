import connect from "../config/DB.js";

const dbMiddleware = async (req, res, next) => {
  try {
    await connect();
    next();
  } catch (error) {
    next(error);
  }
};

export default dbMiddleware;
