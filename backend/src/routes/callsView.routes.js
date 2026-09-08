const express = require("express");
const { studentHome, listOpenCalls, applyToCall, listMyTasks } = require("../controllers/studentCalls.controller");
const { authenticateView, isStudent } = require("../middleware/viewAuth.middleware");
const { applyLimiter } = require("../middleware/rateLimit.middleware");

const router = express.Router();

// Student home / dashboard
router.get("/home", authenticateView, isStudent, studentHome);

// Browse open calls (any authenticated user)
router.get("/", authenticateView, listOpenCalls);

// Apply + view own tasks (students only)
router.post("/:call_id/apply", authenticateView, isStudent, applyLimiter, applyToCall);
router.get("/my-tasks", authenticateView, isStudent, listMyTasks);

module.exports = router;
