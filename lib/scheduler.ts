import schedule from "node-schedule";
import { sendDiscordDailyReport } from "./cron";

let isInitialized = false;

export function initScheduler() {
  if (isInitialized) return;
  isInitialized = true;

  console.log("Initializing Deployment Window Scheduler...");

  // Schedule for 08:00 AM UTC+7 (Asia/Jakarta)
  // node-schedule rule format: minute hour dayOfMonth month dayOfWeek
  const rule = new schedule.RecurrenceRule();
  rule.hour = 8;
  rule.minute = 0;
  rule.tz = "Asia/Jakarta";

  schedule.scheduleJob("deployment-notification", rule, async () => {
    console.log("[Scheduler] Triggering daily deployment check for Discord...");
    await sendDiscordDailyReport();
  });

  console.log("Deployment Scheduler configured to trigger daily at 08:00 AM (Asia/Jakarta).");
}
