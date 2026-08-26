const jwt = require("jsonwebtoken");

/**
 * Cookie-based authentication middleware for view routes.
 * Reads the JWT from the `token` cookie instead of the Authorization header.
 * On failure, redirects to the login page rather than returning JSON.
 */
function authenticateView(req, res, next) {
  const token = req.cookies && req.cookies.token;

  if (!token) {
    return res.redirect("/auth/login");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.redirect("/auth/login");
  }
}

/**
 * Middleware: only allow users with "System Admin" role.
 * Must be used AFTER authenticateView.
 */
function isAdmin(req, res, next) {
  if (req.user && req.user.roles && req.user.roles.includes("System Admin")) {
    return next();
  }
  return res.status(403).send("Forbidden: Admin access required.");
}

/**
 * Middleware: only allow users with "Applicant" role (scholarship students).
 * Must be used AFTER authenticateView.
 */
function isStudent(req, res, next) {
  if (req.user && req.user.roles && req.user.roles.includes("Applicant")) {
    return next();
  }
  return res.status(403).send("Forbidden: Student access required.");
}

module.exports = {
  authenticateView,
  isAdmin,
  isStudent,
};
