const { CallApplication, Student, Call, Event, TaskType } = require("../../models");
const { logAction } = require("../services/audit.service");

async function scanPage(req, res) {
  res.render("grader/scan", {
    title: "Grader QR Scanner — SES",
    currentPage: "grader-scan",
    user: req.user
  });
}

async function verifyQR(req, res) {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: "No token provided." });
    }

    const application = await CallApplication.findOne({
      where: { qr_code_token: token },
      include: [
        { model: Student },
        { 
          model: Call,
          include: [{ model: Event }, { model: TaskType }]
        }
      ]
    });

    if (!application) {
      return res.status(404).json({ success: false, message: "Invalid QR code. No application found." });
    }

    if (application.status !== 'approved') {
      return res.status(400).json({ 
        success: false, 
        message: `Application is not approved. Current status: ${application.status}`,
        studentName: `${application.Student.first_name} ${application.Student.last_name}`
      });
    }

    return res.json({
      success: true,
      application_id: application.id,
      studentName: `${application.Student.first_name} ${application.Student.last_name}`,
      studentNumber: application.Student.student_number,
      eventName: application.Call.Event.title,
      taskName: application.Call.TaskType ? application.Call.TaskType.name : 'General Task',
      call_id: application.call_id
    });

  } catch (err) {
    console.error("verifyQR error:", err);
    return res.status(500).json({ success: false, message: "Server error during verification." });
  }
}

async function awardPoints(req, res) {
  try {
    const { application_id, points } = req.body;
    
    if (!application_id || points === undefined) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const application = await CallApplication.findByPk(application_id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }

    application.status = 'attended';
    application.points_awarded = parseInt(points);
    await application.save();

    await logAction({
      actor_user_id: req.user ? req.user.id : null,
      entity: "CallApplication",
      entity_id: application.id,
      action: "MARK_ATTENDED",
      reason: `Grader marked as attended and awarded ${points} points`
    });

    return res.json({ success: true, message: "Points awarded and attendance recorded successfully!" });
  } catch (err) {
    console.error("awardPoints error:", err);
    return res.status(500).json({ success: false, message: "Server error during point award." });
  }
}

module.exports = { scanPage, verifyQR, awardPoints };
