const express = require("express");

const {
  applicationsPage,
  applicationDetailPage,
  applyPage,
  applySubmit,
  reviewSubmit,
} = require("../controllers/applicationsView.controller");

const { authenticateView } = require("../middleware/viewAuth.middleware");

const router = express.Router();

// All application view routes require authentication
router.use(authenticateView);

// Applicant apply routes
router.get("/new", applyPage);
router.post("/", applySubmit);

// View applications (lists depend on user role)
router.get("/", applicationsPage);
router.get("/:id", applicationDetailPage);

// Admin/Reviewer routes
router.post("/:id/review", reviewSubmit);

module.exports = router;
