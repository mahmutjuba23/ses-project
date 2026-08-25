const { User, Scholarship, Application, Role } = require("../../models");

async function dashboardPage(req, res) {
  try {
    // Check if user is admin or reviewer
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Role, through: { attributes: [] } }],
    });
    
    const isAdminOrReviewer = user.Roles.some(
      (r) => r.name === "admin" || r.name === "reviewer"
    );

    if (!isAdminOrReviewer) {
      return res.redirect("/scholarships");
    }

    // Fetch Stats
    const totalUsers = await User.count();
    const openScholarships = await Scholarship.count({ where: { status: "open" } });
    const pendingApplications = await Application.count({ where: { status: "pending" } });

    // Fetch Recent Applications (last 5)
    const recentApplications = await Application.findAll({
      include: [
        { model: User, as: "applicant", attributes: ["id", "full_name"] },
        { model: Scholarship, as: "scholarship", attributes: ["id", "title"] }
      ],
      order: [["created_at", "DESC"]],
      limit: 5
    });

    res.render("dashboard/index", {
      title: "Dashboard — SES",
      currentPage: "dashboard",
      user: req.user,
      stats: {
        totalUsers,
        openScholarships,
        pendingApplications
      },
      recentApplications: recentApplications.map(app => app.toJSON())
    });

  } catch (error) {
    console.error("Dashboard page error:", error);
    res.redirect("/");
  }
}

module.exports = {
  dashboardPage,
};
