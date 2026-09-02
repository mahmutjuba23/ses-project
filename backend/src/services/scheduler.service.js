const cron = require("node-cron");
const { Event } = require("../../models");
const { logAction } = require("./audit.service");
const { Op } = require("sequelize");

/**
 * Runs every hour.
 * 1. Auto-publishes draft events whose start_date has arrived and end_date hasn't passed.
 * 2. Auto-finishes published events whose end_date has passed.
 */
function startScheduler() {
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();
      const today = now.toISOString().split("T")[0]; // YYYY-MM-DD

      // ── 1. Auto-publish: draft events whose window is now open ──────────
      const toPublish = await Event.findAll({
        where: {
          status: "draft",
          start_date: { [Op.lte]: today },
          end_date:   { [Op.gte]: today }
        }
      });

      for (const event of toPublish) {
        await event.update({ status: "published" });
        await logAction({
          actor_user_id: 1,
          entity: "Event",
          entity_id: event.id,
          action: "AUTO_PUBLISH",
          reason: `Event automatically published because start date (${event.start_date}) has arrived`
        });
        console.log(`[Scheduler] Auto-published event "${event.title}" (ID: ${event.id})`);
      }

      // ── 2. Auto-finish: published events whose end_date has passed ──────
      const toFinish = await Event.findAll({
        where: {
          status: "published",
          end_date: { [Op.lt]: today }
        }
      });

      for (const event of toFinish) {
        await event.update({ status: "finished" });
        await logAction({
          actor_user_id: 1,
          entity: "Event",
          entity_id: event.id,
          action: "AUTO_FINISH",
          reason: `Event automatically finished because end date (${event.end_date}) has passed`
        });
        console.log(`[Scheduler] Auto-finished event "${event.title}" (ID: ${event.id})`);
      }

      if (toPublish.length > 0)
        console.log(`[Scheduler] Auto-published ${toPublish.length} event(s).`);
      if (toFinish.length > 0)
        console.log(`[Scheduler] Auto-finished ${toFinish.length} event(s).`);

    } catch (err) {
      console.error("[Scheduler] Scheduler error:", err.message);
    }
  });

  console.log("[Scheduler] Event scheduler started (runs every hour): auto-publish + auto-finish.");
}

module.exports = { startScheduler };
