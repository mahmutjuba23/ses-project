const { Period, PeriodEnrolment, Student } = require("../../models");
const { logAction } = require("../services/audit.service");
const { Op } = require("sequelize");

async function listPeriods(req, res) {
  try {
    const periods = await Period.findAll({ order: [['start_date', 'DESC']] });
    res.render("admin/periods", {
      title: "Manage Periods — SES",
      currentPage: "admin-periods",
      periods,
      user: req.user
    });
  } catch (error) {
    console.error("List Periods error:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function createPeriod(req, res) {
  try {
    const { code, name, start_date, end_date, point_goal } = req.body;
    
    // Check for overlaps
    const overlapping = await Period.findOne({
      where: {
        [Op.or]: [
          { start_date: { [Op.between]: [start_date, end_date] } },
          { end_date: { [Op.between]: [start_date, end_date] } },
          {
            start_date: { [Op.lte]: start_date },
            end_date: { [Op.gte]: end_date }
          }
        ]
      }
    });

    if (overlapping) {
      return res.redirect("/admin/periods?error=overlap");
    }

    await Period.create({
      code,
      name,
      start_date,
      end_date,
      point_goal,
      status: "draft"
    });

    await logAction({
      actor_user_id: req.user ? req.user.id : 1,
      entity: "Period",
      entity_id: null,
      action: "CREATE_PERIOD",
      reason: "Admin created a new period"
    });

    res.redirect("/admin/periods");
  } catch (error) {
    console.error("Create Period error:", error);
    res.redirect("/admin/periods?error=failed");
  }
}

async function activatePeriod(req, res) {
  try {
    const { period_id } = req.body;
    
    const period = await Period.findByPk(period_id);
    if (!period || period.status !== 'draft') {
      return res.redirect("/admin/periods?error=invalid_period");
    }

    // Activate the period
    period.status = 'active';
    await period.save();

    // Find all active students
    const activeStudents = await Student.findAll({ where: { is_active: true } });
    
    // Bulk create enrolments
    const enrolments = activeStudents.map(student => ({
      period_id: period.id,
      student_id: student.id,
      goal_points: period.point_goal,
      collected_points: 0,
      final_points: 0,
      result_status: 'pending'
    }));

    await PeriodEnrolment.bulkCreate(enrolments);

    await logAction({
      actor_user_id: req.user ? req.user.id : 1,
      entity: "Period",
      entity_id: period.id,
      action: "ACTIVATE_PERIOD",
      reason: `Admin activated period and enrolled ${enrolments.length} students`
    });

    res.redirect("/admin/periods");
  } catch (error) {
    console.error("Activate Period error:", error);
    res.redirect("/admin/periods?error=activation_failed");
  }
}

module.exports = {
  listPeriods,
  createPeriod,
  activatePeriod
};
