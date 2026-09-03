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
      user: req.user,
      error: req.query.error || null
    });
  } catch (error) {
    console.error("List Periods error:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function createPeriod(req, res) {
  try {
    const { code, name, start_date, end_date, point_goal, scope_rule_json } = req.body;
    
    // Check for valid dates
    if (new Date(end_date) <= new Date(start_date)) {
      return res.redirect("/admin/periods?error=invalid_dates");
    }

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

    // Parse scope rule if provided
    let parsedScope = null;
    if (scope_rule_json && scope_rule_json.trim()) {
      try {
        parsedScope = JSON.parse(scope_rule_json);
      } catch (e) {
        return res.redirect("/admin/periods?error=invalid_scope_json");
      }
    }

    await Period.create({
      code,
      name,
      start_date,
      end_date,
      point_goal,
      status: "draft",
      scope_rule_json: parsedScope
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

/**
 * Build a Sequelize where clause from a scope rule JSON.
 * Supported keys: min_scholarship_percentage, study_level, faculty
 */
function buildScopeWhere(scopeRule) {
  const where = { is_active: true };
  if (!scopeRule) return where;

  if (scopeRule.min_scholarship_percentage) {
    where.scholarship_percentage = { [Op.gte]: parseInt(scopeRule.min_scholarship_percentage) };
  }
  if (scopeRule.study_level) {
    where.study_level = scopeRule.study_level;
  }
  if (scopeRule.faculty) {
    where.faculty = scopeRule.faculty;
  }
  return where;
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

    // Apply scope rule to filter students
    const studentWhere = buildScopeWhere(period.scope_rule_json);
    const activeStudents = await Student.findAll({ where: studentWhere });
    
    // Bulk create enrolments
    const enrolments = activeStudents.map(student => ({
      period_id: period.id,
      student_id: student.id,
      goal_points: period.point_goal,
      collected_points: 0,
      final_points: 0,
      result_status: null
    }));

    await PeriodEnrolment.bulkCreate(enrolments);

    await logAction({
      actor_user_id: req.user ? req.user.id : 1,
      entity: "Period",
      entity_id: period.id,
      action: "ACTIVATE_PERIOD",
      reason: `Activated period and enrolled ${enrolments.length} students` +
        (period.scope_rule_json ? ` (scope: ${JSON.stringify(period.scope_rule_json)})` : ' (all active students)')
    });

    res.redirect("/admin/periods");
  } catch (error) {
    console.error("Activate Period error:", error);
    res.redirect("/admin/periods?error=activation_failed");
  }
}

async function showEnrolments(req, res) {
  try {
    const period = await Period.findByPk(req.params.id);
    if (!period) {
      return res.redirect("/admin/periods?error=not_found");
    }

    const enrolments = await PeriodEnrolment.findAll({
      where: { period_id: period.id },
      include: [{ model: Student }]
    });

    res.render("admin/period-enrolments", {
      title: `Enrolments — ${period.name}`,
      currentPage: "admin-periods",
      period,
      enrolments,
      user: req.user
    });
  } catch (error) {
    console.error("Show Enrolments error:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function overrideGoal(req, res) {
  try {
    const { enrolment_id, new_goal, reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.redirect("back");
    }

    const enrolment = await PeriodEnrolment.findByPk(enrolment_id);
    if (!enrolment) {
      return res.redirect("back");
    }

    const oldGoal = enrolment.goal_points;
    enrolment.goal_points = parseInt(new_goal);
    enrolment.goal_override_reason = reason;
    await enrolment.save();

    await logAction({
      actor_user_id: req.user ? req.user.id : 1,
      entity: "PeriodEnrolment",
      entity_id: enrolment.id,
      action: "OVERRIDE_GOAL",
      old_value: { goal_points: oldGoal },
      new_value: { goal_points: parseInt(new_goal) },
      reason
    });

    res.redirect(`/admin/periods/${enrolment.period_id}/enrolments`);
  } catch (error) {
    console.error("Override Goal error:", error);
    res.redirect("back");
  }
}

module.exports = {
  listPeriods,
  createPeriod,
  activatePeriod,
  showEnrolments,
  overrideGoal
};
