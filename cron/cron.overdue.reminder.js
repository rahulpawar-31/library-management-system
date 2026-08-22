import cron from "node-cron";
import Loan from "../models/loan.model.js";
import { transporter } from "../configs/config.mail.js";

cron.schedule("0 8 * * *", async () => {
  try {
    const now = new Date();

    const overdueLoans = await Loan.find({
      returnedAt: null,
      dueDate: { $lt: now },
      reminderSentAt: null
    })
      .populate("book", "title")
      .populate("user", "name email");

    for (const loan of overdueLoans) {
      if (!loan.user?.email) continue;

      await transporter.sendMail({
        from: `"Library System" <${process.env.EMAIL_USER}>`,
        to: loan.user.email,
        subject: "Overdue Book Reminder",
        html: `
          <h2>Overdue Book</h2>
          <p>Hi ${loan.user.name},</p>
          <p>"${loan.book?.title || "A book"}" was due back on ${loan.dueDate.toDateString()}. Please return it as soon as possible.</p>
        `
      });

      loan.reminderSentAt = now;
      await loan.save();
    }

    console.log(`Sent ${overdueLoans.length} overdue reminder emails`);
  } catch (error) {
    console.error("Cron error:", error.message);
  }
});
