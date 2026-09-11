const cron = require("node-cron");
const { Event, PeriodEnrolment, Student, Call, Period, CallApplication } = require("../../models");
const { logAction } = require("./audit.service");
const { sendMail } = require("./mailer.service");
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

        // Notify enrolled students
        const enrolments = await PeriodEnrolment.findAll({
          where: { period_id: event.period_id },
          include: [{ model: Student }]
        });
        
        for (const enr of enrolments) {
          if (enr.Student && enr.Student.email) {
            try {
              await sendMail({
                to: enr.Student.email,
                subject: `SES: New Event Published - ${event.title}`,
                template: "event-published",
                locals: {
                  studentName: enr.Student.first_name,
                  eventTitle: event.title,
                  callsUrl: "http://localhost:3010/calls"
                }
              });
              // avoid Mailtrap rate limit
              await new Promise(r => setTimeout(r, 1500));
            } catch (e) {
              console.error("Scheduler mail error (event-published):", e);
            }
          }
        }
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

  // ── 3. Call Reminder (Runs daily at 08:00) ─────────────────────────────────
  cron.schedule("0 8 * * *", async () => {
    try {
      console.log("[Scheduler] Running daily call reminders...");
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 2);
      const targetStr = targetDate.toISOString().split("T")[0]; // Exactly 48 hours away (date string)

      const callsClosingSoon = await Call.findAll({
        where: {
          [Op.and]: [
            sequelize.where(sequelize.fn('DATE', sequelize.col('application_end')), targetStr)
          ]
        },
        include: [{ model: Event, include: [{ model: Period }] }]
      });

      for (const call of callsClosingSoon) {
        const enrolments = await PeriodEnrolment.findAll({
          where: { period_id: call.Event.period_id },
          include: [{ model: Student }]
        });

        for (const enr of enrolments) {
          if (!enr.Student || !enr.Student.email) continue;
          
          // Check if applied
          const hasApplied = await CallApplication.findOne({
            where: { call_id: call.id, student_id: enr.student_id }
          });
          
          if (!hasApplied) {
            try {
              await sendMail({
                to: enr.Student.email,
                subject: "SES Reminder: Call Closing Soon",
                template: "call-reminder",
                locals: {
                  studentName: enr.Student.first_name,
                  callTitle: call.TaskType ? call.TaskType.name : "Event Call",
                  callsUrl: "http://localhost:3010/calls"
                }
              });
              await new Promise(r => setTimeout(r, 1500));
            } catch (e) {
               console.error("Scheduler mail error (call-reminder):", e);
            }
          }
        }
      }
    } catch (err) {
      console.error("[Scheduler] Reminder error:", err.message);
    }
  });
  console.log("[Scheduler] Daily reminder scheduler started (runs at 08:00).");
}

module.exports = { startScheduler };
