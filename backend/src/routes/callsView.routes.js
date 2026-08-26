const express = require("express");
const { listOpenCalls } = require("../controllers/studentCalls.controller");
const { authenticateView } = require("../middleware/viewAuth.middleware");

const router = express.Router();

// Any authenticated user can browse calls (both admin and students can see them)
router.get("/", authenticateView, listOpenCalls);

module.exports = router;
