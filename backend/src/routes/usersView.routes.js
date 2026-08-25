const express = require("express");

const {
  usersPage,
  userDetailPage,
  createUserPage,
  createUserSubmit,
  editUserPage,
  updateUserSubmit,
  deleteUserPage,
  deleteUserSubmit,
} = require("../controllers/users.controller");

const { authenticateView } = require("../middleware/viewAuth.middleware");

const router = express.Router();

// All user management views require authentication
router.use(authenticateView);

// List all users
router.get("/", usersPage);

// Create user form
router.get("/create", createUserPage);
router.post("/", createUserSubmit);

// User detail
router.get("/:id", userDetailPage);

// Edit user form
router.get("/:id/edit", editUserPage);
router.post("/:id", updateUserSubmit);

// Delete user confirmation & action
router.get("/:id/delete", deleteUserPage);
router.post("/:id/delete", deleteUserSubmit);

module.exports = router;
