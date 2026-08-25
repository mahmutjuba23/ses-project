const express = require("express");
const { dashboardPage } = require("../controllers/dashboard.controller");
const { authenticateView } = require("../middleware/viewAuth.middleware");

const router = express.Router();

router.use(authenticateView);
router.get("/", dashboardPage);

module.exports = router;
