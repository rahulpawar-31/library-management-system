import mongoose, { Schema } from "mongoose";

const loanSchema = new mongoose.Schema({
  book: {
    type: Schema.Types.ObjectId,
    ref: "Book",
    required: true,
    index: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  borrowedAt: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  returnedAt: {
    type: Date,
    default: null
  },
  reminderSentAt: {
    type: Date,
    default: null
  }
},{
  timestamps: true
})

const Loan = mongoose.model("Loan", loanSchema);

export default Loan;
