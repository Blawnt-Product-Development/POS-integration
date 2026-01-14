import cron from "node-cron";
import { Sync } from "./sync";

const sync = new Sync();

// Run every day at 2 AM
cron.schedule("0 2 * * *", async () => {
  console.log("Running daily sync at 2 AM");
  await sync.runDailySync();
});

// Manual test
(async () => {
  console.log("Running manual sync...");
  await sync.runDailySync();
})();