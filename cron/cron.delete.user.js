import cron from "node-cron";
import User from "../models/user.model.js";

cron.schedule("0 0 * * *", async () => {
  console.log("Running auto delete job...");

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000);

    const result = await User.deleteMany({
      isDeleted: true,
      deletedAt: { $lte: thirtyDaysAgo }
    });

    console.log(`Deleted ${result.deletedCount} users permanently`);
  } catch (error) {
    console.log("Cron error:", error.message);
  }
});
