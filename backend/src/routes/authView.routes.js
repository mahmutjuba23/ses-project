const express = require("express");

const {
  loginPage,
  registerPage,
  loginSubmit,
  registerSubmit,
  profilePage,
  mockGoogleLogin,
} = require("../controllers/auth.controller");

const { authenticateView } = require("../middleware/viewAuth.middleware");

const router = express.Router();

// GET pages
router.get("/login", loginPage);
router.post("/login", loginSubmit);
router.get("/mock-google", mockGoogleLogin);
router.get("/register", registerPage);
router.get("/me", authenticateView, profilePage);

// POST form submissions
router.post("/login", loginSubmit);
router.post("/register", registerSubmit);

module.exports = router;
