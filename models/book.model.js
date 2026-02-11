import mongoose, { Schema } from "mongoose";

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 3
  },
  publishedYear:{
    type: Number
  },
  description:{
    type: String,
  },
  coverImage: {
    type: String,
    required: true
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "Author",
    required: true,
    index: true
  }, 
  status: {
  type: Boolean,
  default: true
},
deletedAt: {
  type: Date,
  default: null
}
},{
  timestamps: true
})

const Book = mongoose.model("Book", bookSchema);

export default Book;