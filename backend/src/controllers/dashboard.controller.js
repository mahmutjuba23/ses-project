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

    // Find the active period to track live progress
    const activePeriod = await Period.findOne({ where: { status: "active" } });

    let systemGoal = 0;
    let systemCollected = 0;
    let facultyData = {}; // Structure: { [facultyName]: { goal: 0, collected: 0, departments: { [deptName]: { goal: 0, collected: 0 } } } }

    if (activePeriod) {
      // Fetch all enrolments for the active period, including the student to get faculty/dept
      const enrolments = await PeriodEnrolment.findAll({
        where: { period_id: activePeriod.id },
        include: [{ 
          model: Student, 
          attributes: ['faculty', 'department'],
          where: { is_active: true }
        }]
      });

      // Aggregate data
      for (const enr of enrolments) {
        const student = enr.Student;
        if (!student || !student.faculty || !student.department) continue;
        
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

    res.render("dashboard/index", {
      user: req.user,
      title: "Dashboard Statistics",
      activePeriod,
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
      facultyData: {}
    });
  }
}

module.exports = {
  dashboardPage,
};
