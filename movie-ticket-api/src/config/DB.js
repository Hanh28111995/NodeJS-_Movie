import mongoose from 'mongoose'


export default async function connect() {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.MONGO_DB, {
      serverSelectionTimeoutMS: 5000, // Tăng lên 5s để ổn định hơn trên cloud
    })

    console.log('connect successfully')
  } catch (error) {
    console.log('connect fail', error.message)
    throw error
  }
}

