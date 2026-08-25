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

const { authenticateView } = require("../middleware/viewAuth.middleware");

const router = express.Router();

// Public pages — no login required
router.get("/", scholarshipsPage);
router.get("/:id", scholarshipDetailPage);

// Admin-only write pages
router.get("/create", authenticateView, createScholarshipPage);
router.post("/", authenticateView, createScholarshipSubmit);
router.get("/:id/edit", authenticateView, editScholarshipPage);
router.post("/:id", authenticateView, updateScholarshipSubmit);
router.get("/:id/delete", authenticateView, deleteScholarshipPage);
router.post("/:id/delete", authenticateView, deleteScholarshipSubmit);

module.exports = router;
