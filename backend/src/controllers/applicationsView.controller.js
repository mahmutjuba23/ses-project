const { Application, Scholarship, User, Role } = require("../../models");

async function applicationsPage(req, res) {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Role, through: { attributes: [] } }],
    });

    const isAdminOrReviewer = user.Roles.some((r) => r.name === "admin" || r.name === "reviewer");

    let applications = [];

    if (isAdminOrReviewer) {
      // Admins and reviewers see all applications
      applications = await Application.findAll({
        include: [
          { model: Scholarship, as: "scholarship", attributes: ["id", "title"] },
          { model: User, as: "applicant", attributes: ["id", "full_name"] },
        ],
        order: [["created_at", "DESC"]],
      });
    } else {
      // Normal applicants only see their own
      applications = await Application.findAll({
        where: { user_id: req.user.id },
        include: [
          { model: Scholarship, as: "scholarship", attributes: ["id", "title"] },
        ],
        order: [["created_at", "DESC"]],
      });
    }

    res.render("applications/index", {
      title: "Applications — SES",
      currentPage: "applications",
      applications: applications.map((a) => a.toJSON()),
      user: req.user,
      isAdmin: user.Roles.some((r) => r.name === "admin"),
      isReviewer: user.Roles.some((r) => r.name === "reviewer"),
    });
  } catch (error) {
    console.error("Applications page error:", error);
    res.render("applications/index", {
      title: "Applications — SES",
      currentPage: "applications",
      applications: [],
      user: req.user,
      error: "Failed to load applications",
    });
  }
}

async function applicationDetailPage(req, res) {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Role, through: { attributes: [] } }],
    });
    
    const isAdmin = user.Roles.some((r) => r.name === "admin");
    const isReviewer = user.Roles.some((r) => r.name === "reviewer");
    const isAdminOrReviewer = isAdmin || isReviewer;

    const application = await Application.findByPk(id, {
      include: [
        { model: Scholarship, as: "scholarship" },
        { model: User, as: "applicant" },
      ],
    });

    if (!application) {
      return res.redirect("/applications");
    }

    // Security: Only allow access if admin/reviewer or if it's the applicant's own application
    if (!isAdminOrReviewer && application.user_id !== req.user.id) {
      return res.redirect("/applications");
    }

    res.render("applications/show", {
      title: `Application Details — SES`,
      currentPage: "applications",
      application: application.toJSON(),
      user: req.user,
      isAdmin,
      isReviewer,
    });
  } catch (error) {
    console.error("Application detail page error:", error);
    res.redirect("/applications");
  }
}

async function applyPage(req, res) {
  try {
    const { scholarship_id } = req.query;
    
    if (!scholarship_id) {
      return res.redirect("/scholarships");
    }

    const scholarship = await Scholarship.findByPk(scholarship_id);
    
    if (!scholarship || scholarship.status !== "open") {
      return res.redirect("/scholarships");
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      where: { user_id: req.user.id, scholarship_id },
    });

    if (existingApplication) {
      // Redirect to their existing application
      return res.redirect(`/applications/${existingApplication.id}`);
    }

    res.render("applications/new", {
      title: `Apply to ${scholarship.title} — SES`,
      currentPage: "scholarships",
      scholarship: scholarship.toJSON(),
      user: req.user,
    });
  } catch (error) {
    console.error("Apply page error:", error);
    res.redirect("/scholarships");
  }
}

async function applySubmit(req, res) {
  try {
    const { scholarship_id, cover_letter } = req.body;

    const scholarship = await Scholarship.findByPk(scholarship_id);
    if (!scholarship || scholarship.status !== "open") {
      return res.redirect("/scholarships");
    }

    const existingApplication = await Application.findOne({
      where: { user_id: req.user.id, scholarship_id },
    });

    if (existingApplication) {
      return res.redirect(`/applications/${existingApplication.id}`);
    }

    await Application.create({
      user_id: req.user.id,
      scholarship_id,
      cover_letter,
      status: "pending",
    });

    return res.redirect("/applications");
  } catch (error) {
    console.error("Apply submit error:", error);
    return res.redirect("/scholarships");
  }
}

async function reviewSubmit(req, res) {
  try {
    const { id } = req.params;
    const { status, reviewer_notes } = req.body;

    // Check user role
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Role, through: { attributes: [] } }],
    });
    
    const isAdminOrReviewer = user.Roles.some((r) => r.name === "admin" || r.name === "reviewer");
    if (!isAdminOrReviewer) {
       return res.redirect(`/applications/${id}`);
    }

    const application = await Application.findByPk(id);
    if (!application) return res.redirect("/applications");

    if (status) application.status = status;
    if (reviewer_notes !== undefined) application.reviewer_notes = reviewer_notes;
    
    application.reviewed_by = req.user.id;
    application.reviewed_at = new Date();

    await application.save();

    return res.redirect(`/applications/${id}`);
  } catch (error) {
    console.error("Review submit error:", error);
    res.redirect("/applications");
  }
}

module.exports = {
  applicationsPage,
  applicationDetailPage,
  applyPage,
  applySubmit,
  reviewSubmit,
};
