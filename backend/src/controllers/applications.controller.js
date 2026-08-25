const { Application, Scholarship, User } = require("../../models");

async function getApplications(req, res) {
  try {
    const applications = await Application.findAll({
      include: [
        {
          model: User,
          as: "applicant",
          attributes: ["id", "full_name", "email"],
        },
        {
          model: Scholarship,
          as: "scholarship",
          attributes: ["id", "title", "amount"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({ data: applications });
  } catch (error) {
    console.error("Get applications error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function getApplicationById(req, res) {
  try {
    const { id } = req.params;

    const application = await Application.findByPk(id, {
      include: [
        {
          model: User,
          as: "applicant",
          attributes: ["id", "full_name", "email"],
        },
        {
          model: Scholarship,
          as: "scholarship",
        },
        {
          model: User,
          as: "reviewer",
          attributes: ["id", "full_name", "email"],
        },
      ],
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    return res.status(200).json({ data: application });
  } catch (error) {
    console.error("Get application error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function createApplication(req, res) {
  try {
    const { scholarship_id, cover_letter } = req.body;

    const scholarship = await Scholarship.findByPk(scholarship_id);
    if (!scholarship || scholarship.status !== "open") {
      return res.status(400).json({ message: "Scholarship is not open for applications" });
    }

    const existingApplication = await Application.findOne({
      where: { user_id: req.user.id, scholarship_id },
    });

    if (existingApplication) {
      return res.status(409).json({ message: "You have already applied to this scholarship" });
    }

    const application = await Application.create({
      user_id: req.user.id,
      scholarship_id,
      cover_letter,
      resume_file: req.file ? req.file.filename : null,
      status: "pending",
    });

    return res.status(201).json({
      message: "Application submitted successfully",
      data: application,
    });
  } catch (error) {
    console.error("Create application error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function updateApplicationStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, reviewer_notes } = req.body;

    const application = await Application.findByPk(id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (status !== undefined) application.status = status;
    if (reviewer_notes !== undefined) application.reviewer_notes = reviewer_notes;
    
    application.reviewed_by = req.user.id;
    application.reviewed_at = new Date();

    await application.save();

    return res.status(200).json({
      message: "Application updated successfully",
      data: application,
    });
  } catch (error) {
    console.error("Update application status error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplicationStatus,
};
