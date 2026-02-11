import mongoose from "mongoose";

const AuthorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2
  },
  bio: {
    type: String,
    required: true
  },
  birthDate: {
    type: Date,
    required: true
  }, 
  status:{
    type: Boolean,
    default: true
  }
},{
  timestamps: true,
}) 

const Author = mongoose.model("Author", AuthorSchema);

export default Author;