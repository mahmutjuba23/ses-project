const { User, Role, Student, PeriodEnrolment, Period } = require("../../models");
const { Op } = require("sequelize");

async function dashboardPage(req, res) {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Role, through: { attributes: [] } }],
    });

    const isAdminOrReviewer = user.Roles.some(
      (r) => r.name === "admin" || r.name === "reviewer"
    );

    if (!isAdminOrReviewer) {
      return res.redirect("/scholarships");
    }

    // Load all periods for the dropdown selector
    const allPeriods = await Period.findAll({
      order: [['start_date', 'DESC']]
    });

    // Determine which period to show: query param > active > most recent
    let selectedPeriod = null;
    if (req.query.period_id) {
      selectedPeriod = await Period.findByPk(req.query.period_id);
    }
    if (!selectedPeriod) {
      selectedPeriod = await Period.findOne({ where: { status: "active" } });
    }
    if (!selectedPeriod && allPeriods.length > 0) {
      selectedPeriod = allPeriods[0]; // Most recent
    }

    let systemGoal = 0;
    let systemCollected = 0;
    let facultyData = {}; // Structure: { [facultyName]: { goal: 0, collected: 0, departments: { [deptName]: { goal: 0, collected: 0 } } } }

    if (selectedPeriod) {
      // Fetch all enrolments for the selected period, including student info
      const enrolments = await PeriodEnrolment.findAll({
        where: { period_id: selectedPeriod.id },
        include: [{ 
          model: Student, 
          attributes: ['faculty', 'department', 'is_active'],
        }]
      });

      // Aggregate data
      for (const enr of enrolments) {
        const student = enr.Student;
        if (!student || !student.faculty || !student.department || !student.is_active) continue;
        
        const fac = student.faculty;
        const dept = student.department;
        const goal = enr.goal_points || 0;
        const collected = enr.collected_points || 0;

        systemGoal += goal;
        systemCollected += collected;

        if (!facultyData[fac]) {
          facultyData[fac] = { goal: 0, collected: 0, departments: {} };
        }
        if (!facultyData[fac].departments[dept]) {
          facultyData[fac].departments[dept] = { goal: 0, collected: 0 };
        }

        facultyData[fac].goal += goal;
        facultyData[fac].collected += collected;
        facultyData[fac].departments[dept].goal += goal;
        facultyData[fac].departments[dept].collected += collected;
      }
    }

    // Keep activePeriod for display (the actual active one, separate from selected)
    const activePeriod = await Period.findOne({ where: { status: "active" } });

    res.render("dashboard/index", {
      user: req.user,
      title: "Dashboard Statistics",
      activePeriod,
      selectedPeriod,
      allPeriods,
      systemGoal,
      systemCollected,
      facultyData,
      Math // Pass Math object for percentage calculation in Pug
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.render("dashboard/index", { 
      user: req.user, 
      error: "Error loading dashboard data", 
      title: "Dashboard",
      facultyData: {},
      allPeriods: []
    });
  }
}

module.exports = {
  dashboardPage,
};
