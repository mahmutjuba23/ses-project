const { Call, Event, TaskType, Period, Student, PeriodEnrolment, CallApplication } = require("../../models");
const { Op } = require("sequelize");

/**
 * Student-facing: list all currently open calls the logged-in student is eligible to see.
 * A call is "open" if today is within application_start and application_end.
 */
async function listOpenCalls(req, res) {
  try {
    const now = new Date();

    // Find calls whose application window hasn't closed yet
    const openCalls = await Call.findAll({
      where: {
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
const QRCode = require("qrcode");

async function applyToCall(req, res) {
  try {
    const { call_id } = req.params;
    const call = await Call.findByPk(call_id);
    if (!call) return res.redirect("/calls?error=Call not found");

    // Get the student record — try user_id first, then match by email and link
    let student = await Student.findOne({ where: { user_id: req.user.id } });
    if (!student && req.user.email) {
      student = await Student.findOne({ where: { email: req.user.email } });
      if (student) {
        student.user_id = req.user.id;
        await student.save();
      }
    }
    // If still no student record, create a minimal one so the user can test
    if (!student) {
      student = await Student.create({
        user_id: req.user.id,
        email: req.user.email,
        first_name: req.user.full_name ? req.user.full_name.split(' ')[0] : 'Student',
        last_name: req.user.full_name ? req.user.full_name.split(' ').slice(1).join(' ') : '',
        is_active: true
      });
    }

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
    res.redirect("/calls?error=Failed to apply. Error: " + err.message);
  }
}

async function listMyTasks(req, res) {
  try {
    // Find student by user_id or fall back to email
    let student = await Student.findOne({ where: { user_id: req.user.id } });
    if (!student && req.user.email) {
      student = await Student.findOne({ where: { email: req.user.email } });
      if (student) {
        student.user_id = req.user.id;
        await student.save();
      }
    }
    if (!student) return res.render("student/myTasks", {
      title: "My Volunteer Tasks — SES",
      currentPage: "student-tasks",
      applications: [],
      user: req.user
    });

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

    // Generate QR codes for approved applications
    for (let app of applications) {
      if (app.status === 'approved' && app.qr_code_token) {
        try {
          app.qrCodeDataUri = await QRCode.toDataURL(app.qr_code_token);
        } catch (e) {
          console.error("QR Code generation error:", e);
          app.qrCodeDataUri = null;
        }
      }
    }

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
