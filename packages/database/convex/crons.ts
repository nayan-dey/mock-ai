import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check for overdue fees daily at 6:00 AM UTC
crons.daily(
  "check overdue fees",
  { hourUTC: 6, minuteUTC: 0 },
  internal.notifications.checkOverdueFees
);

// Clean up old read notifications weekly on Sunday at 3:00 AM UTC
crons.weekly(
  "cleanup old notifications",
  { hourUTC: 3, minuteUTC: 0, dayOfWeek: "sunday" },
  internal.notifications.cleanupOldNotifications
);

export default crons;
