import mongoose from 'mongoose'


export default async function connect() {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.MONGO_DB, {
      useUnifiedTopology: true, // For Mongoose 5 only. Remove for Mongoose 6+
      serverSelectionTimeoutMS: 1000, // Defaults to 30000 (30 seconds)
    })

    console.log('connect successfully')
  } catch (error) {
    console.log('connect fail')
  }
}

