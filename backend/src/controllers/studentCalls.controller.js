const { sequelize, Call, Event, TaskType, Period, Student, PeriodEnrolment, CallApplication } = require("../../models");
const { Op } = require("sequelize");
const crypto = require("crypto");

/**
 * Student home page — shows their current period progress + recent applications.
 */
async function studentHome(req, res) {
  try {
    let student = await Student.findOne({ where: { user_id: req.user.id } });
    if (!student && req.user.email) {
      student = await Student.findOne({ where: { email: req.user.email } });
      if (student) { student.user_id = req.user.id; await student.save(); }
    }

    const activePeriod = await Period.findOne({ where: { status: 'active' } });
    let enrolment = null;
    let recentApps = [];

    if (student) {
      if (activePeriod) {
        enrolment = await PeriodEnrolment.findOne({
          where: { student_id: student.id, period_id: activePeriod.id }
        });
      }
      recentApps = await CallApplication.findAll({
        where: { student_id: student.id },
        include: [{ model: Call, include: [{ model: Event }, { model: TaskType }] }],
        order: [['createdAt', 'DESC']],
        limit: 5
      });
    }

    res.render("student/home", {
      title: "My Dashboard — SES",
      user: req.user,
      student,
      activePeriod,
      enrolment,
      recentApps,
      success: req.query.success,
      error: req.query.error
    });
  } catch (err) {
    console.error("Student Home error:", err);
    res.status(500).send("Internal Server Error");
  }
}

/**
 * Student-facing: list all currently open calls.
 */
async function listOpenCalls(req, res) {
  try {
    const now = new Date();
    let student = await Student.findOne({ where: { user_id: req.user.id } });
    if (!student && req.user.email) {
      student = await Student.findOne({ where: { email: req.user.email } });
    }

    // Get call IDs the student has already applied to
    let appliedCallIds = [];
    if (student) {
      const myApps = await CallApplication.findAll({ where: { student_id: student.id }, attributes: ['call_id'] });
      appliedCallIds = myApps.map(a => a.call_id);
    }

    const openCalls = await Call.findAll({
      where: { application_end: { [Op.gte]: now } },
      include: [
        { model: Event, include: [{ model: Period }] },
        { model: TaskType }
      ],
      order: [['application_end', 'ASC']]
    });

    res.render("student/calls", {
      title: "Available Calls — SES",
      openCalls,
      appliedCallIds,
      user: req.user,
      success: req.query.success,
      error: req.query.error
    });
  } catch (err) {
    console.error("List Open Calls error:", err);
    res.status(500).send("Internal Server Error");
  }
}

async function applyToCall(req, res) {
  try {
    const { call_id } = req.params;

    // Use a transaction with row locking to prevent race condition on quota
    await sequelize.transaction(async (t) => {
      const call = await Call.findByPk(call_id, { lock: t.LOCK.UPDATE, transaction: t });
      if (!call) throw new Error("Call not found");

      let student = await Student.findOne({ where: { user_id: req.user.id }, transaction: t });
      if (!student && req.user.email) {
        student = await Student.findOne({ where: { email: req.user.email }, transaction: t });
        if (student) { student.user_id = req.user.id; await student.save({ transaction: t }); }
      }
      if (!student) {
        student = await Student.create({
          user_id: req.user.id,
          email: req.user.email,
          first_name: req.user.full_name ? req.user.full_name.split(' ')[0] : 'Student',
          last_name: req.user.full_name ? req.user.full_name.split(' ').slice(1).join(' ') : '',
          is_active: true
        }, { transaction: t });
      }

      const existing = await CallApplication.findOne({ 
        where: { call_id: call.id, student_id: student.id },
        transaction: t 
      });
      if (existing) throw new Error("You have already applied to this call");

      // Check quota — count approved+attended
      const approvedCount = await CallApplication.count({ 
        where: { call_id: call.id, status: ['approved', 'attended'] },
        transaction: t 
      });
      
      let status;
      if (call.auto_approve) {
        status = approvedCount < call.quota ? 'approved' : (call.has_waitlist ? 'waitlisted' : null);
      } else {
        status = approvedCount < call.quota ? 'pending' : (call.has_waitlist ? 'waitlisted' : null);
      }
      if (!status) throw new Error("This call is full and has no waitlist");

      await CallApplication.create({
        call_id: call.id,
        student_id: student.id,
        status,
        qr_code_token: crypto.randomBytes(16).toString("hex")
      }, { transaction: t });
    });

    res.redirect("/calls?success=Application submitted successfully!");
  } catch (err) {
    console.error("Apply to Call error:", err);
    res.redirect("/calls?error=" + err.message);
  }
}

async function listMyTasks(req, res) {
  try {
    let student = await Student.findOne({ where: { user_id: req.user.id } });
    if (!student && req.user.email) {
      student = await Student.findOne({ where: { email: req.user.email } });
      if (student) { student.user_id = req.user.id; await student.save(); }
    }

    if (!student) return res.render("student/myTasks", {
      title: "My Tasks — SES", applications: [], enrolments: [], user: req.user
    });

    const applications = await CallApplication.findAll({
      where: { student_id: student.id },
      include: [{ model: Call, include: [{ model: Event, include: [{ model: Period }] }, { model: TaskType }] }],
      order: [['createdAt', 'DESC']]
    });

    // All period enrolments for history
    const enrolments = await PeriodEnrolment.findAll({
      where: { student_id: student.id },
      include: [{ model: Period }],
      order: [['createdAt', 'DESC']]
    });

    res.render("student/myTasks", {
      title: "My Tasks — SES",
      applications,
      enrolments,
      user: req.user
    });
  } catch (err) {
    console.error("List My Tasks error:", err);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = { studentHome, listOpenCalls, applyToCall, listMyTasks };
