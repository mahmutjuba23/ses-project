const express = require("express");
const { listOpenCalls, applyToCall, listMyTasks } = require("../controllers/studentCalls.controller");
const { authenticateView, isStudent } = require("../middleware/viewAuth.middleware");

const router = express.Router();

// Any authenticated user can browse calls
router.get("/", authenticateView, listOpenCalls);

// Students apply and view their tasks
router.post("/:call_id/apply", authenticateView, isStudent, applyToCall);
router.get("/my-tasks", authenticateView, isStudent, listMyTasks);

module.exports = router;
