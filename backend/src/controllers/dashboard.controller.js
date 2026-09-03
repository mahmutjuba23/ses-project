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

    const selectedFaculty = req.query.faculty ? req.query.faculty.trim() : null;
    const selectedDepartment = req.query.department ? req.query.department.trim() : null;

    // Get all unique faculties
    const faculties = await Student.findAll({
      attributes: ['faculty'],
      where: { faculty: { [Op.ne]: null } },
      group: ['faculty'],
      order: [['faculty', 'ASC']]
    });

    // Build a map of all departments grouped by faculty (for hover flyout)
    const allDeptRows = await Student.findAll({
      attributes: ['faculty', 'department'],
      where: { faculty: { [Op.ne]: null }, department: { [Op.ne]: null } },
      group: ['faculty', 'department'],
      order: [['faculty', 'ASC'], ['department', 'ASC']]
    });
    const allDepartments = {};
    for (const row of allDeptRows) {
      if (!allDepartments[row.faculty]) allDepartments[row.faculty] = [];
      allDepartments[row.faculty].push(row.department);
    }

    // Get departments for the selected faculty (still used for breadcrumb logic)
    let departments = allDepartments[selectedFaculty] || [];

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
      allDepartments,
      departments,
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
