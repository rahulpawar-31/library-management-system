import express from "express";

import {
  createUser,
  login,
  getUsers,
  getSingleUser,
  updateUser,
  softDeleteUser,
  restoreUser,
  verifyOtp,
  changePassword,
  forgetPassword,
  resetPassword
} from "../controllers/user.controller.js";

import { verifyToken } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";

const userRouter = express.Router();

// Register
userRouter.post("/register", createUser);

// Login
userRouter.post("/login", login);

// Get all users 
userRouter.get(
  "/",
  verifyToken,
  roleMiddleware(["admin"]),
  getUsers
);

// Get single user
userRouter.get(
  "/:id",
  verifyToken,
  getSingleUser
);
// Update user 
userRouter.put(
  "/:id",
  verifyToken,
  updateUser
);
// Change password 
userRouter.put(
  "/change-password",
  verifyToken,
  changePassword
);
// Forgot password 
userRouter.post(
  "/forgot-password",
  forgetPassword
);
// Reset password 
userRouter.post(
  "/reset-password",
  resetPassword
);
// Verify Email OTP
userRouter.post(
  "/verify-otp",
  verifyOtp
);

// Soft delete user 
userRouter.delete(
  "/soft-delete/:id",
  verifyToken,
  roleMiddleware(["admin"]),
  softDeleteUser
);

// Restore user 
userRouter.put(
  "/restore/:id",
  verifyToken,
  roleMiddleware(["admin"]),
  restoreUser
);


export default userRouter;
