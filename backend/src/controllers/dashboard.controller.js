const { User, Role, Student } = require("../../models");
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

    const selectedFaculty = req.query.faculty || null;
    const selectedDepartment = req.query.department || null;

    // Get all unique faculties
    const faculties = await Student.findAll({
      attributes: ['faculty'],
      where: { faculty: { [Op.ne]: null } },
      group: ['faculty'],
      order: [['faculty', 'ASC']]
    });

    // Get departments for the selected faculty
    let departments = [];
    if (selectedFaculty) {
      departments = await Student.findAll({
        attributes: ['department'],
        where: { faculty: selectedFaculty, department: { [Op.ne]: null } },
        group: ['department'],
        order: [['department', 'ASC']]
      });
    }

    // Get student list based on filters
    const whereClause = {};
    if (selectedFaculty) whereClause.faculty = selectedFaculty;
    if (selectedDepartment) whereClause.department = selectedDepartment;

    const students = (selectedFaculty) ? await Student.findAll({
      where: whereClause,
      order: [['last_name', 'ASC'], ['first_name', 'ASC']]
    }) : [];

    // Summary stats
    const totalStudents = await Student.count();
    const activeStudents = await Student.count({ where: { is_active: true } });
    const totalFaculties = faculties.length;

    res.render("dashboard/index", {
      title: "Dashboard — SES",
      currentPage: "dashboard",
      user: req.user,
      faculties: faculties.map(f => f.faculty),
      departments: departments.map(d => d.department),
      students,
      selectedFaculty,
      selectedDepartment,
      stats: { totalStudents, activeStudents, totalFaculties }
    });

  } catch (error) {
    console.error("Dashboard page error:", error);
    res.redirect("/");
  }
}

module.exports = { dashboardPage };
