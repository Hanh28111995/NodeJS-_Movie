import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_DB;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}

const connect = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;

  return cached.conn;
};

const dbMiddleware = async (req, res, next) => {
  try {
    await connect();

    next(); // KHÔNG return
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Database connection failed",
      error: error.message,
    });
  }
};

export default dbMiddleware;