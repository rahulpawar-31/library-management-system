import cron from "node-cron";
import Book from "../models/book.model.js";

cron.schedule("0 0 * * *", async () => {
  try {
    const date = new Date();
    date.setDate(date.getDate() - 30);

    const result = await Book.deleteMany({
      status: false,
      deletedAt: { $lt: date }
    });

    console.log(`Deleted ${result.deletedCount} old books`);
  } catch (error) {
    console.error("Cron error:", error.message);
  }
});
