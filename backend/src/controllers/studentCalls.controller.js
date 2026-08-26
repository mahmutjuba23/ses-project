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
      user: req.user
    });
  } catch (err) {
    console.error("List Open Calls error:", err);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = { listOpenCalls };
