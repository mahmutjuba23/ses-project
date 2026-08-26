const { Call, Event, TaskType, Period, CallApplication, Student, User } = require("../../models");
const { logAction } = require("../services/audit.service");

async function listCalls(req, res) {
  try {
    const calls = await Call.findAll({
      include: [
        { model: Event, include: [{ model: Period }] },
        { model: TaskType }
      ],
      order: [['application_start', 'DESC']]
    });

    const events = await Event.findAll({
      where: { status: 'published' },
      include: [{ model: Period }]
    });
    const taskTypes = await TaskType.findAll({ where: { is_active: true } });

    res.render("admin/calls", {
      title: "Manage Calls — SES",
      currentPage: "admin-calls",
      calls,
      events,
      taskTypes,
      user: req.user,
      pageWarning: req.query.warning || null
    });
  } catch (err) {
    console.error("List Calls error:", err);
    res.status(500).send("Internal Server Error");
  }
}

async function createCall(req, res) {
  try {
    const {
      event_id, task_type_id, quota,
      application_start, application_end,
      task_start, task_end,
      auto_approve, has_waitlist,
      eligibility_rule_json
    } = req.body;

    // Validate application_end > application_start
    if (new Date(application_end) <= new Date(application_start)) {
      return res.redirect("/admin/calls?warning=dates_invalid");
    }

    let parsedEligibility = null;
    if (eligibility_rule_json && eligibility_rule_json.trim()) {
      try {
        parsedEligibility = JSON.parse(eligibility_rule_json);
      } catch (e) {
        return res.redirect("/admin/calls?warning=invalid_json");
      }
    }

    const call = await Call.create({
      event_id,
      task_type_id,
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
      reason: "Admin created a new call"
    });

    res.redirect("/admin/calls");
  } catch (err) {
    console.error("Create Call error:", err);
    res.redirect("/admin/calls?warning=failed");
  }
}

async function deleteCall(req, res) {
  try {
    const { call_id } = req.body;
    await Call.destroy({ where: { id: call_id } });

    await logAction({
      actor_user_id: req.user.id,
      entity: "Call",
      entity_id: call_id,
      action: "DELETE_CALL",
      reason: "Admin deleted a call"
    });

    res.redirect("/admin/calls");
  } catch (err) {
    console.error("Delete Call error:", err);
    res.redirect("/admin/calls?warning=delete_failed");
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

    if (!call) return res.redirect("/admin/calls?warning=not_found");

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
    const { app_id, status } = req.body;
    const application = await CallApplication.findByPk(app_id);
    
    if (!application) return res.redirect("/admin/calls?warning=app_not_found");

    application.status = status;
    // Generate QR code if approved and doesn't have one
    if (status === 'approved' && !application.qr_code_token) {
      application.qr_code_token = crypto.randomBytes(16).toString("hex");
    }

    await application.save();

    await logAction({
      actor_user_id: req.user.id,
      entity: "CallApplication",
      entity_id: app_id,
      action: "UPDATE_STATUS",
      reason: `Admin updated status to ${status}`
    });

    res.redirect(`/admin/calls/${application.call_id}/applications`);
  } catch (err) {
    console.error("Update Application Status error:", err);
    res.redirect("/admin/calls?warning=update_failed");
  }
}

module.exports = { listCalls, createCall, deleteCall, reviewApplications, updateApplicationStatus };
