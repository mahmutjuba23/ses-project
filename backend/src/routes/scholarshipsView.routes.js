const express = require("express");

const {
  scholarshipsPage,
  scholarshipDetailPage,
  createScholarshipPage,
  createScholarshipSubmit,
  editScholarshipPage,
  updateScholarshipSubmit,
  deleteScholarshipPage,
  deleteScholarshipSubmit,
} = require("../controllers/scholarshipsView.controller");

const { authenticateView, optionalAuth } = require("../middleware/viewAuth.middleware");

const router = express.Router();

// Public pages — no login required, but optional auth to keep sidebar intact
router.get("/", optionalAuth, scholarshipsPage);
router.get("/:id", optionalAuth, scholarshipDetailPage);

// Admin-only write pages
router.get("/create", authenticateView, createScholarshipPage);
router.post("/", authenticateView, createScholarshipSubmit);
router.get("/:id/edit", authenticateView, editScholarshipPage);
router.post("/:id", authenticateView, updateScholarshipSubmit);
router.get("/:id/delete", authenticateView, deleteScholarshipPage);
router.post("/:id/delete", authenticateView, deleteScholarshipSubmit);

module.exports = router;
