const express = require("express");

const {
  getScholarships,
  getScholarshipById,
  createScholarship,
  updateScholarship,
  deleteScholarship,
} = require("../controllers/scholarships.controller");

const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

const router = express.Router();

// Public — anyone can browse open scholarships
router.get("/", getScholarships);
router.get("/:id", getScholarshipById);

// Admin only — create, update, delete
router.post("/", authenticate, authorize("admin"), createScholarship);
router.patch("/:id", authenticate, authorize("admin"), updateScholarship);
router.delete("/:id", authenticate, authorize("admin"), deleteScholarship);

module.exports = router;
