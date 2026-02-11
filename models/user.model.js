import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
  }, 
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },
  status: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user"
  },
  otp: {
  type: String,
},

otpExpiry: {
  type: Date,
},

emailVerified: {
  type: Boolean,
  default: false
},
isDeleted: {
  type: Boolean,
  default: false
},
deletedAt: {
  type: Date,
  default: null
}

},{
  timestamps: true,
})

const User = mongoose.model("User", userSchema);

export default User;