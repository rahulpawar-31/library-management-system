import express from "express";

import {
  checkoutBook,
  returnBook,
  getMyLoans,
  getLoans,
  getBookLoanStatus
} from "../controllers/loan.controller.js";

import { verifyToken } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";

const loanRouter = express.Router();

// Loan status for a book (public — shows availability)
loanRouter.get("/book/:bookId", getBookLoanStatus);

// Current user's loans
loanRouter.get("/my", verifyToken, getMyLoans);

// All loans (admin)
loanRouter.get("/", verifyToken, roleMiddleware(["admin"]), getLoans);

// Checkout (borrow) a book
loanRouter.post("/checkout", verifyToken, checkoutBook);

// Return a book
loanRouter.put("/return/:id", verifyToken, returnBook);

export default loanRouter;
