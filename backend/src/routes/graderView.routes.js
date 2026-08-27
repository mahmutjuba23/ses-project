const express = require("express");
const { scanPage, verifyQR, awardPoints } = require("../controllers/grader.controller");
const { authenticateView } = require("../middleware/viewAuth.middleware");

const router = express.Router();

// Currently we allow anyone with admin or reviewer role to use the scanner
// Since the user is bypassing roles, we'll just require authentication for now,
// but in a real app we'd add an `isGrader` middleware.

router.get("/scan", authenticateView, scanPage);
router.post("/scan/verify", authenticateView, verifyQR);
router.post("/scan/award-points", authenticateView, awardPoints);

module.exports = router;
