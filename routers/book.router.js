import express from "express";
import upload from "../middleware/upload.middleware.js";

import {
  createBook,
  getBook,
  getSingleBook,
  updateBooks,
  deleteBook,
} from "../controllers/book.controller.js";

const bookRouter = express.Router();

// Create
bookRouter.post("/", upload.single("coverImage"), createBook);

// Get All
bookRouter.get("/", getBook);

// Get Single
bookRouter.get("/:id", getSingleBook);

// Update
bookRouter.put("/:id", updateBooks);

// Delete
bookRouter.delete("/:id", deleteBook);

export default bookRouter;
