const { Call, Event, TaskType, Period, CallApplication, Student, User, PeriodEnrolment } = require("../../models");
const { logAction } = require("../services/audit.service");

async function listEventCalls(req, res) {
  try {
    const { event_id } = req.params;
    
    const event = await Event.findByPk(event_id, {
      include: [{ model: Period }]
    });

    if (!event) return res.redirect("/admin/events?warning=event_not_found");

    const calls = await Call.findAll({
      where: { event_id },
      include: [
        { model: Event, include: [{ model: Period }] },
        { model: TaskType }
      ],
      order: [['application_start', 'DESC']]
    });

    const taskTypes = await TaskType.findAll({ where: { is_active: true } });

    res.render("admin/event-calls", {
      title: `Manage Calls: ${event.title} — SES`,
      currentPage: "admin-events",
      calls,
      event,
      taskTypes,
      user: req.user,
      pageWarning: req.query.warning || null
    });
  } catch (err) {
    console.error("List Event Calls error:", err);
    res.status(500).send("Internal Server Error");
  }
}

async function createCall(req, res) {
  try {
    const {
      event_id, task_type_name, quota,
      application_start, application_end,
      task_start, task_end,
      auto_approve, has_waitlist,
      eligibility_rule_json
    } = req.body;

    // Validate application_end > application_start
    if (new Date(application_end) <= new Date(application_start)) {
      return res.redirect(`/admin/events/${event_id}?warning=dates_invalid`);
    }

    // Find or create the TaskType by name
    const trimmedName = (task_type_name || '').trim();
    if (!trimmedName) {
      return res.redirect(`/admin/events/${event_id}?warning=no_task_type`);
    }
    const [taskType] = await TaskType.findOrCreate({
      where: { name: trimmedName },
      defaults: { name: trimmedName, is_active: true }
    });

    let parsedEligibility = null;
    if (eligibility_rule_json && eligibility_rule_json.trim()) {
      try {
        parsedEligibility = JSON.parse(eligibility_rule_json);
      } catch (e) {
        return res.redirect(`/admin/events/${event_id}?warning=invalid_json`);
      }
    }

    const call = await Call.create({
      event_id,
      task_type_id: taskType.id,
      quota: parseInt(quota),
      application_start,
      application_end,
      task_start,
      task_end,
      auto_approve: auto_approve === 'on',
      has_waitlist: has_waitlist === 'on',
      eligibility_rule_json: parsedEligibility
    });

    await logAction({
      actor_user_id: req.user.id,
      entity: "Call",
      entity_id: call.id,
      action: "CREATE_CALL",
      reason: `Admin created a new call with task type: ${trimmedName}`
    });

    res.redirect(`/admin/events/${event_id}`);
  } catch (err) {
    console.error("Create Call error:", err);
    res.redirect(`/admin/events/${req.body.event_id}?warning=failed`);
  }
}

async function deleteCall(req, res) {
  try {
    const { call_id, event_id } = req.body;
    await Call.destroy({ where: { id: call_id } });

    await logAction({
      actor_user_id: req.user.id,
      entity: "Call",
      entity_id: call_id,
      action: "DELETE_CALL",
      reason: "Admin deleted a call"
    });

    res.redirect(`/admin/events/${event_id}`);
  } catch (err) {
    console.error("Delete Call error:", err);
    res.redirect(`/admin/events/${req.body.event_id}?warning=delete_failed`);
  }
}

const crypto = require("crypto");

async function reviewApplications(req, res) {
  try {
    const { call_id } = req.params;
    const call = await Call.findByPk(call_id, {
      include: [
        { model: Event },
        { model: TaskType }
      ]
    });

    if (!call) return res.redirect(`/admin/events?warning=not_found`);

    const applications = await CallApplication.findAll({
      where: { call_id },
      include: [
        { 
          model: Student,
          include: ['User'] // Note: User needs to be aliased if it's set up that way, usually it's just User.
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.render("admin/review-applications", {
      title: "Review Applications — SES",
      currentPage: "admin-calls",
      call,
      applications,
      user: req.user,
      pageWarning: req.query.warning || null
    });
  } catch (err) {
    console.error("Review Applications error:", err);
    res.status(500).send("Internal Server Error");
  }
}

async function updateApplicationStatus(req, res) {
  try {
    const { app_id, status, points } = req.body;
    const application = await CallApplication.findByPk(app_id, {
      include: [
        { 
          model: Call,
          include: [{ model: Event }]
        }
      ]
    });
    
    if (!application) return res.redirect(`/admin/events?warning=app_not_found`);

    // Prevent giving points multiple times if already attended
    if (application.status === 'attended' && status === 'attended') {
      return res.redirect(`/admin/events/${application.Call.event_id}?call_id=${application.call_id}`);
    }

    application.status = status;
    
    if (status === 'attended' && points !== undefined) {
      const awarded = parseInt(points, 10) || 0;
      application.points_awarded = awarded;
      
      // Update PeriodEnrolment collected_points
      const periodId = application.Call.Event.period_id;
      const enrolment = await PeriodEnrolment.findOne({
        where: { student_id: application.student_id, period_id: periodId }
      });
      
      if (enrolment) {
        enrolment.collected_points = (enrolment.collected_points || 0) + awarded;
        
        // Auto-update result status if they reached their goal
        if (enrolment.collected_points >= enrolment.goal_points) {
          enrolment.result_status = 'PASS';
        }
        await enrolment.save();
      }
    }

    await application.save();

    await logAction({
      actor_user_id: req.user.id,
      entity: "CallApplication",
      entity_id: app_id,
      action: "UPDATE_STATUS",
      reason: `Admin updated status to ${status}${status === 'attended' ? ` with ${application.points_awarded} points` : ''}`
    });

    res.redirect(`/admin/events/${application.Call.event_id}?call_id=${application.call_id}`);
  } catch (err) {
    console.error("Update Application Status error:", err);
    res.redirect(`/admin/events`);
  }
}

module.exports = { createCall, deleteCall, updateApplicationStatus };
