import express from "express";
import {
  createAuthor,
  getAuthors,
  getSingleAuthor,
  updateAuthor,
  deleteAuthor
} from "../controllers/author.controller.js";

const authorRouter = express.Router();

authorRouter.post("/", createAuthor);
authorRouter.get("/", getAuthors);
authorRouter.get("/:id", getSingleAuthor);
authorRouter.put("/:id", updateAuthor);
authorRouter.delete("/:id", deleteAuthor);

export default authorRouter;
