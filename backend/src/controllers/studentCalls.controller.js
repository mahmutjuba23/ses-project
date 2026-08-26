const { Call, Event, TaskType, Period, Student, PeriodEnrolment } = require("../../models");
const { Op } = require("sequelize");

/**
 * Student-facing: list all currently open calls the logged-in student is eligible to see.
 * A call is "open" if today is within application_start and application_end.
 */
async function listOpenCalls(req, res) {
  try {
    const now = new Date();

    // Find open calls
    const openCalls = await Call.findAll({
      where: {
        application_start: { [Op.lte]: now },
        application_end: { [Op.gte]: now }
      },
      include: [
        {
          model: Event,
          where: { status: 'published' },
          include: [{ model: Period }]
        },
        { model: TaskType }
      ],
      order: [['application_end', 'ASC']]
    });

    res.render("student/calls", {
      title: "Available Calls — SES",
      currentPage: "student-calls",
      openCalls,
      user: req.user,
      success: req.query.success,
      error: req.query.error
    });
  } catch (err) {
    console.error("List Open Calls error:", err);
    res.status(500).send("Internal Server Error");
  }
}

const crypto = require("crypto");

async function applyToCall(req, res) {
  try {
    const { call_id } = req.params;
    const call = await Call.findByPk(call_id);
    if (!call) return res.redirect("/calls?error=Call not found");

    // Get the student record for the logged-in user
    const student = await Student.findOne({ where: { user_id: req.user.id } });
    if (!student) return res.redirect("/calls?error=Student profile not found. Are you an imported scholarship student?");

    // Check if already applied
    const existing = await CallApplication.findOne({
      where: { call_id: call.id, student_id: student.id }
    });
    if (existing) return res.redirect("/calls?error=You have already applied to this call");

    // Simple auto-approve check for now
    const status = call.auto_approve ? 'approved' : 'pending';
    const token = crypto.randomBytes(16).toString("hex");

    await CallApplication.create({
      call_id: call.id,
      student_id: student.id,
      status,
      qr_code_token: token
    });

    res.redirect("/calls?success=Application submitted successfully!");
  } catch (err) {
    console.error("Apply to Call error:", err);
    res.redirect("/calls?error=Failed to apply");
  }
}

async function listMyTasks(req, res) {
  try {
    const student = await Student.findOne({ where: { user_id: req.user.id } });
    if (!student) return res.redirect("/?error=Student profile not found");

    const applications = await CallApplication.findAll({
      where: { student_id: student.id },
      include: [
        { 
          model: Call,
          include: [
            { model: Event, include: [{ model: Period }] },
            { model: TaskType }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.render("student/myTasks", {
      title: "My Volunteer Tasks — SES",
      currentPage: "student-tasks",
      applications,
      user: req.user
    });
  } catch (err) {
    console.error("List My Tasks error:", err);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = { listOpenCalls, applyToCall, listMyTasks };
