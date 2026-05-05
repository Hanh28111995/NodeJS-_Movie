import mongoose from 'mongoose'

let cachedDb = null;

export default async function connect() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  try {
    mongoose.set('strictQuery', false);
    const db = await mongoose.connect(process.env.MONGO_DB, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10, // Duy trì pool kết nối
      minPoolSize: 2,
    })

    cachedDb = db;
    console.log('Database connected successfully')
    return db;
  } catch (error) {
    console.log('Database connection fail', error.message)
    throw error
  }
}

