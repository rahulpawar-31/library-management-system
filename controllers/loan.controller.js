import Loan from "../models/loan.model.js";
import Book from "../models/book.model.js";

const LOAN_PERIOD_DAYS = 14;

// checkout (borrow) a book

export const checkoutBook = async (req, res) => {
  try {
    const { bookId } = req.body;

    const book = await Book.findOne({ _id: bookId, status: true });
    if (!book) return res.status(404).json({ message: "Book not found" });

    const existingLoan = await Loan.findOne({ book: bookId, returnedAt: null });
    if (existingLoan) {
      return res.status(400).json({ message: "Book is currently unavailable" });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + LOAN_PERIOD_DAYS);

    const loan = await Loan.create({ book: bookId, user: req.user.id, dueDate });

    res.status(201).json({
      success: true,
      data: loan
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// return a book

export const returnBook = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: "Loan not found" });

    if (loan.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (loan.returnedAt) {
      return res.status(400).json({ message: "Book already returned" });
    }

    loan.returnedAt = new Date();
    await loan.save();

    res.json({
      success: true,
      data: loan
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get current user's loans (active + history)

export const getMyLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ user: req.user.id })
      .populate("book", "title coverImage")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: loans
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get all loans (admin)

export const getLoans = async (req, res) => {
  try {
    const loans = await Loan.find({})
      .populate("book", "title coverImage")
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: loans
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get the active loan (if any) for a book — public, used to show availability

export const getBookLoanStatus = async (req, res) => {
  try {
    const loan = await Loan.findOne({ book: req.params.bookId, returnedAt: null })
      .select("user dueDate");

    res.json({
      success: true,
      data: loan
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
