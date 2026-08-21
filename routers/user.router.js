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
// Change password
// Must come before the "/:id" PUT route below — otherwise Express matches
// "change-password" as an :id value and this handler is never reached.
userRouter.put(
  "/change-password",
  verifyToken,
  changePassword
);
// Update user
userRouter.put(
  "/:id",
  verifyToken,
  updateUser
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
