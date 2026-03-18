import mongoose from "mongoose";

const cinemaSchema = new mongoose.Schema(
  {    
    cinema: {
      type: String,
      required: true,       
    },
    address: {
      type: String,
      required: true,       
    },
    theaters: [
      {
        type: mongoose.Schema.Types.ObjectId,   
        ref: "theater",
      },
    ],  
  },
  {
    timestamps: true,
    collection: "cinemas", // specify the collection name here
  }
);

const Cinema = mongoose.model("cinemas", cinemaSchema);

export default Cinema;
