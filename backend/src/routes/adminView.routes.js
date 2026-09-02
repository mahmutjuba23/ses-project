const express = require("express");
const { manageUsersPage, assignRole, removeRole, importStudentsExcel, listStudents, viewStudentProfile } = require("../controllers/admin.controller");
const { listPeriods, createPeriod, activatePeriod, showEnrolments, overrideGoal } = require("../controllers/periods.controller");
const { listEvents, createEvent, updateEvent, publishEvent, cancelEvent, viewEventDetails } = require("../controllers/events.controller");
const { createCall, deleteCall, updateApplicationStatus } = require("../controllers/calls.controller");
const { authenticateView, isAdmin } = require("../middleware/viewAuth.middleware");

const router = express.Router();

// All admin routes require authentication AND admin role
const adminOnly = [authenticateView, isAdmin];

const { excelUpload } = require("../middleware/upload.middleware");

// Students & Users
router.get("/users", adminOnly, manageUsersPage);
router.post("/users/assign-role", adminOnly, assignRole);
router.post("/users/remove-role", adminOnly, removeRole);

// Excel Student Import
router.post("/students/import", adminOnly, excelUpload.single("file"), importStudentsExcel);
router.get("/students", adminOnly, listStudents);
router.get("/students/:id", adminOnly, viewStudentProfile);

// Periods
router.get("/periods", adminOnly, listPeriods);
router.post("/periods/create", adminOnly, createPeriod);
router.post("/periods/activate", adminOnly, activatePeriod);
router.get("/periods/:id/enrolments", adminOnly, showEnrolments);
router.post("/periods/override-goal", adminOnly, overrideGoal);

// Events
router.get("/events", adminOnly, listEvents);
router.post("/events/create", adminOnly, createEvent);
router.post("/events/update", adminOnly, updateEvent);
router.post("/events/publish", adminOnly, publishEvent);
router.post("/events/cancel", adminOnly, cancelEvent);

// Calls for a specific event
router.get("/events/:event_id", adminOnly, viewEventDetails);
router.post("/events/calls/create", adminOnly, createCall);
router.post("/events/calls/delete", adminOnly, deleteCall);
router.post("/calls/applications/status", adminOnly, updateApplicationStatus);

module.exports = router;
