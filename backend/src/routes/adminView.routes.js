const express = require("express");
const { manageUsersPage, assignRole, removeRole } = require("../controllers/admin.controller");
const { listPeriods, createPeriod, activatePeriod, showEnrolments, overrideGoal } = require("../controllers/periods.controller");
const { authenticateView } = require("../middleware/viewAuth.middleware");

const router = express.Router();

// Users
router.get("/users", authenticateView, manageUsersPage);
router.post("/users/assign-role", authenticateView, assignRole);
router.post("/users/remove-role", authenticateView, removeRole);

// Periods
router.get("/periods", authenticateView, listPeriods);
router.post("/periods/create", authenticateView, createPeriod);
router.post("/periods/activate", authenticateView, activatePeriod);
router.get("/periods/:id/enrolments", authenticateView, showEnrolments);
router.post("/periods/override-goal", authenticateView, overrideGoal);

module.exports = router;
