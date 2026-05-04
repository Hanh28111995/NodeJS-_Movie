import mongoose from 'mongoose'

let isConnected = false;

export default async function connect() {
  if (isConnected) {
    console.log('Using existing database connection');
    return;
  }

  try {
    mongoose.set('strictQuery', false);
    const db = await mongoose.connect(process.env.MONGO_DB, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      socketTimeoutMS: 45000,
    })

    isConnected = db.connections[0].readyState;
    console.log('New database connection established');
  } catch (error) {
    console.log('connect fail', error.message)
    throw error
  }
}

