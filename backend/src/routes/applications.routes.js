const express = require("express");

const {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplicationStatus,
} = require("../controllers/applications.controller");

const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

const router = express.Router();

// Applicant routes
router.post("/", authenticate, createApplication);

// Admin/Reviewer routes
// Note: In a real app, you might want to restrict getApplications to only see the current user's applications if they are an applicant, and all if admin/reviewer. For now, we restrict to admin.
router.get("/", authenticate, authorize("admin"), getApplications);
router.get("/:id", authenticate, authorize("admin"), getApplicationById);
router.patch("/:id/status", authenticate, authorize("admin"), updateApplicationStatus);

module.exports = router;
