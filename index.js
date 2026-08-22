import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import "./cron/cron.delete.user.js"
import "./cron/cron.delete.book.js";
import "./cron/cron.overdue.reminder.js";


import userRouter from "./routers/user.router.js";
import bookRouter from "./routers/book.router.js";
import authorRouter from "./routers/author.router.js";
import loanRouter from "./routers/loan.router.js";



const app = express();
const PORT = process.env.PORT || 8080;

// middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));



// Test route
app.get("/", (req, res)=>{
  res.send("API is running");
})

// route

app.use("/api/v1/users", userRouter);
app.use("/api/v1/books", bookRouter);
app.use("/api/v1/authors", authorRouter);
app.use("/api/v1/loans", loanRouter);


mongoose.connect(process.env.MONGO_URI)
.then(()=>{console.log("Connected to Mongo DB");
app.listen(PORT, ()=>{console.log(`Server is running on PORT: ${PORT}`) 
});
})
.catch(err => {console.error("Something went wrong while connecting to MongooseDB", err.message);
});

