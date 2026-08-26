const { Scholarship, User } = require("../../models");

async function getScholarships(req, res) {
  try {
    const scholarships = await Scholarship.findAll({
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "full_name", "email"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      data: scholarships,
    });
  } catch (error) {
    console.error("Get scholarships error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function getScholarshipById(req, res) {
  try {
    const { id } = req.params;

    const scholarship = await Scholarship.findByPk(id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "full_name", "email"],
        },
      ],
    });

    if (!scholarship) {
      return res.status(404).json({ message: "Scholarship not found" });
    }

    return res.status(200).json({ data: scholarship });
  } catch (error) {
    console.error("Get scholarship error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function createScholarship(req, res) {
  try {
    const { title, description, amount, deadline, status } = req.body;

    const scholarship = await Scholarship.create({
      title,
      description,
      amount,
      deadline,
      status: status || "draft",
      created_by: req.user.id,
    });

    return res.status(201).json({
      message: "Scholarship created successfully",
      data: scholarship,
    });
  } catch (error) {
    console.error("Create scholarship error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function updateScholarship(req, res) {
  try {
    const { id } = req.params;
    const { title, description, amount, deadline, status } = req.body;

    const scholarship = await Scholarship.findByPk(id);

    if (!scholarship) {
      return res.status(404).json({ message: "Scholarship not found" });
    }

    if (title !== undefined) scholarship.title = title;
    if (description !== undefined) scholarship.description = description;
    if (amount !== undefined) scholarship.amount = amount;
    if (deadline !== undefined) scholarship.deadline = deadline;
    if (status !== undefined) scholarship.status = status;

    await scholarship.save();

    return res.status(200).json({
      message: "Scholarship updated successfully",
      data: scholarship,
    });
  } catch (error) {
    console.error("Update scholarship error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function deleteScholarship(req, res) {
  try {
    const { id } = req.params;

    const scholarship = await Scholarship.findByPk(id);

    if (!scholarship) {
      return res.status(404).json({ message: "Scholarship not found" });
    }

    await scholarship.destroy();

    return res.status(200).json({ message: "Scholarship deleted successfully" });
  } catch (error) {
    console.error("Delete scholarship error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  getScholarships,
  getScholarshipById,
  createScholarship,
  updateScholarship,
  deleteScholarship,
};
