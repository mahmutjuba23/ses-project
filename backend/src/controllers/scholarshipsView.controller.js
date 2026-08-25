const { Scholarship, User } = require("../../models");

const scholarshipWithCreator = {
  include: [
    {
      model: User,
      as: "creator",
      attributes: ["id", "full_name", "email"],
    },
  ],
};

async function scholarshipsPage(req, res) {
  try {
    const scholarships = await Scholarship.findAll({
      ...scholarshipWithCreator,
      order: [["created_at", "DESC"]],
    });

    res.render("scholarships/index", {
      title: "Scholarships — SES",
      metaDescription: "Browse available scholarships",
      currentPage: "scholarships",
      scholarships: scholarships.map((s) => s.toJSON()),
      user: req.user || null,
    });
  } catch (error) {
    console.error("Scholarships page error:", error);
    res.render("scholarships/index", {
      title: "Scholarships — SES",
      currentPage: "scholarships",
      scholarships: [],
      user: req.user || null,
      error: "Failed to load scholarships",
    });
  }
}

async function scholarshipDetailPage(req, res) {
  try {
    const { id } = req.params;
    const scholarship = await Scholarship.findByPk(id, scholarshipWithCreator);

    if (!scholarship) {
      return res.redirect("/scholarships");
    }

    res.render("scholarships/show", {
      title: `${scholarship.title} — SES`,
      currentPage: "scholarships",
      scholarship: scholarship.toJSON(),
      user: req.user || null,
    });
  } catch (error) {
    console.error("Scholarship detail page error:", error);
    res.redirect("/scholarships");
  }
}

function createScholarshipPage(req, res) {
  res.render("scholarships/create", {
    title: "New Scholarship — SES",
    currentPage: "scholarships",
    user: req.user,
  });
}

async function createScholarshipSubmit(req, res) {
  try {
    const { title, description, amount, deadline, status } = req.body;

    await Scholarship.create({
      title,
      description,
      amount,
      deadline,
      status: status || "draft",
      created_by: req.user.id,
    });

    return res.redirect("/scholarships");
  } catch (error) {
    console.error("Create scholarship submit error:", error);
    return res.render("scholarships/create", {
      title: "New Scholarship — SES",
      currentPage: "scholarships",
      user: req.user,
      error: "Failed to create scholarship",
    });
  }
}

async function editScholarshipPage(req, res) {
  try {
    const { id } = req.params;
    const scholarship = await Scholarship.findByPk(id);

    if (!scholarship) return res.redirect("/scholarships");

    res.render("scholarships/edit", {
      title: `Edit ${scholarship.title} — SES`,
      currentPage: "scholarships",
      scholarship: scholarship.toJSON(),
      user: req.user,
    });
  } catch (error) {
    console.error("Edit scholarship page error:", error);
    res.redirect("/scholarships");
  }
}

async function updateScholarshipSubmit(req, res) {
  try {
    const { id } = req.params;
    const { title, description, amount, deadline, status } = req.body;

    const scholarship = await Scholarship.findByPk(id);
    if (!scholarship) return res.redirect("/scholarships");

    if (title !== undefined) scholarship.title = title;
    if (description !== undefined) scholarship.description = description;
    if (amount !== undefined) scholarship.amount = amount;
    if (deadline !== undefined) scholarship.deadline = deadline;
    if (status !== undefined) scholarship.status = status;

    await scholarship.save();
    return res.redirect(`/scholarships/${scholarship.id}`);
  } catch (error) {
    console.error("Update scholarship submit error:", error);
    res.redirect("/scholarships");
  }
}

async function deleteScholarshipPage(req, res) {
  try {
    const { id } = req.params;
    const scholarship = await Scholarship.findByPk(id);

    if (!scholarship) return res.redirect("/scholarships");

    res.render("scholarships/delete", {
      title: `Delete ${scholarship.title} — SES`,
      currentPage: "scholarships",
      scholarship: scholarship.toJSON(),
      user: req.user,
    });
  } catch (error) {
    console.error("Delete scholarship page error:", error);
    res.redirect("/scholarships");
  }
}

async function deleteScholarshipSubmit(req, res) {
  try {
    const { id } = req.params;
    const scholarship = await Scholarship.findByPk(id);
    if (scholarship) await scholarship.destroy();
    return res.redirect("/scholarships");
  } catch (error) {
    console.error("Delete scholarship submit error:", error);
    res.redirect("/scholarships");
  }
}

module.exports = {
  scholarshipsPage,
  scholarshipDetailPage,
  createScholarshipPage,
  createScholarshipSubmit,
  editScholarshipPage,
  updateScholarshipSubmit,
  deleteScholarshipPage,
  deleteScholarshipSubmit,
};
