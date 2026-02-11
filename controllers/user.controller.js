import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import{ transporter } from "../configs/config.mail.js";


dotenv.config();

// create user 

export const createUser = async(req, res) =>{
  try{
    const { name, email, password, role} = req.body;

    // check if user exits--

    const existingUser = await User.findOne({ email });
    if(existingUser) {
      return res.status(400).json({
        message: "User already exists with this email",
        success: false
      });
    }

    // Hash the password

    
      
      const  SALT = Number( process.env.SALT) || 10;
    
      const hashedPassword = await bcrypt.hash(password, SALT);
      console.log("Hashed Password :", hashedPassword);

    const newUser = await User.create({
      name, 
      email, 
      password: hashedPassword, 
      role,
      status: true});

    const userResponse = newUser.toObject();
    delete userResponse.password;

    return res.status(201).json({
      data: userResponse,
      message: "New user",
      success: true
    })

  }
  catch(err){
    console.log("CREATE USER ERROR:", err);
    return res.status(500).json({
      message: err.message,
      success: false
    })
  }
};


// login

export const login = async(req, res)=> {
  try{
    let {email, password} =req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required"
      });
    }

    const existingUser = await User.findOne({ email, isDeleted: false }).select("+password");

    if(!existingUser)  {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    const compare = await bcrypt.compare(password,existingUser.password)
    console.log(compare);
    if(!compare) {
      return res.status(401).json({
        message: "Invalid credentials",
        success: false,
      });
    }

    // generate token
    const token = jwt.sign({id: existingUser._id, role: existingUser.role}, process.env.TOKEN_SECRET, {expiresIn: "24h"});
    console.log(token);

    const userData = existingUser.toObject();
    delete userData.password;
    return res.status(200).json({
      data: userData,
      token, 
      message: "User Logged in",
      success: true
    })
  }catch(err){
    console.log(err);
  return res.status(500).json({
    message: err.message,
    success: false
  });
  }
};

// GET ALL USERS

export const getUsers = async (req, res) => {
  try{
    const users = await User.find({ status: true, isDeleted: false}).select("-password");
    res.json(users);
  }catch(error){
    res.status(500).json({
      message: error.message
    });
  }
}

// Get Single User 

export const getSingleUser = async (req, res) =>{
  try{
    const user = await User.findOne({
      _id: req.params.id,
      status: true,
      isDeleted: false
    }).select("-password");

    if(!user){
      return res.status(404).json({ message: "User not found"});
    }
    res.json(user);
  }catch(error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// update user
export const updateUser = async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // 2. Controlled update (only allow name to be changed)
    const {password, role, email, ...updateData } = req.body;
    
    const user = await User.findOneAndUpdate(
      { _id: req.params.id},
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// soft delete user 
export const softDeleteUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found or already deleted"
      });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: "User soft deleted. Can restore within 30 days."
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// delete After 30 days

export const deleteExpiredUsers = async () => {
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  );

  await User.deleteMany({
    isDeleted: true,
    deletedAt: { $lte: thirtyDaysAgo }
  });
};

// restore User


export const restoreUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      isDeleted: true
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found or not deleted"
      });
    }

    const daysPassed =
      (Date.now() - user.deletedAt) / (1000 * 60 * 60 * 24);

    if (daysPassed > 30) {
      return res.status(400).json({
        message: "Restore period expired"
      });
    }

    user.isDeleted = false;
    user.deletedAt = null;
    await user.save();

    res.json({
      success: true,
      message: "User restored successfully"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




// verify otp


  export const verifyOtp = async (req, res) => {
    try{
  const { email, otp } = req.body;

  if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required"
      });
    }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.otp !== otp || user.otpExpiry < Date.now()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  user.emailVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;

  await user.save();

  
    return res.status(200).json({
      message: "OTP verified successfully"
    });

} catch (error){
  res.status(500).json({
    message: error.message
  })
}
};


// CHANGE PASSWORD 
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Passwords required" });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(oldPassword, user.password);

    if (!match) {
      return res.status(400).json({ message: "Old password incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password changed successfully" });

  } catch (error) {
    console.log(error); // important
    res.status(500).json({ message: error.message });
  }
};




// FORGET PASSWORD 
export const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    // SEND OTP EMAIL
    await transporter.sendMail({
      from: `"Auth System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset OTP",
      html: `
        <h2>Password Reset Request</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
      `
    });

    return res.status(200).json({
      message: "OTP sent to email",
      success: true
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false
    });
  }
};



// RESET PASSWORD 
export const resetPassword = async (req, res) => {
  try{
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email });
  if (!user || user.otp !== otp || user.otpExpiry < Date.now()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.otp = null;
  user.otpExpiry = null;

  await user.save();

  res.json({ message: "Password reset successfully" });
}catch (error) {
  res.status(500).json({
    message: error.message
  });
}
};
