import mongoose from "mongoose";

const inforTicketSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.String,
        ref: 'users',
        required: true
    },
    id_movie: {
        type: mongoose.Schema.Types.String,
        ref: 'movies',
        required: true
    },    
    startTime: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    id_theater: {
        type: mongoose.Schema.Types.String,
        ref: 'theater',
        required: true
    },    
    seatName: {
      type: Array,
      required: true,
    },
    paymentMethod: {
        type: String,
        enum: ['momo', 'internet banking', 'cash'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Pending'
    },
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'infoTicket' // specify the collection name here
});

inforTicketSchema.index({ user_id: 1, createdAt: -1 });
inforTicketSchema.index({ paymentStatus: 1 });

const InforTicket = mongoose.model('infoTicket', inforTicketSchema);

export default InforTicket;