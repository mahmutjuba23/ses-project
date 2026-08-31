const cron = require("node-cron");
const { Event } = require("../../models");
const { logAction } = require("./audit.service");
const { Op } = require("sequelize");

/**
 * Runs every hour.
 * Finds all "published" events whose end_date has passed and marks them as "finished".
 */
function startScheduler() {
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();
      const today = now.toISOString().split("T")[0]; // YYYY-MM-DD

      const overdueEvents = await Event.findAll({
        where: {
          status: "published",
          end_date: { [Op.lt]: today }
        }
      });

      for (const event of overdueEvents) {
        await event.update({ status: "finished" });
        await logAction({
          actor_user_id: 1, // system actor
          entity: "Event",
          entity_id: event.id,
          action: "AUTO_FINISH",
          reason: `Event automatically finished because end date (${event.end_date}) has passed`
        });
        console.log(`[Scheduler] Auto-finished event "${event.title}" (ID: ${event.id})`);
      }

      if (overdueEvents.length > 0) {
        console.log(`[Scheduler] Auto-finished ${overdueEvents.length} event(s).`);
      }
    } catch (err) {
      console.error("[Scheduler] Auto-finish events error:", err.message);
    }
  });

  console.log("[Scheduler] Event auto-finish scheduler started (runs every hour).");
}

module.exports = { startScheduler };
