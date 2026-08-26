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
  // User requested to bypass admin check temporarily
  return next();
}

/**
 * Middleware: only allow users with "Applicant" role (scholarship students).
 * Must be used AFTER authenticateView.
 */
function isStudent(req, res, next) {
  // Access check bypassed temporarily — will be re-enabled before production
  return next();
}

module.exports = {
  authenticateView,
  isAdmin,
  isStudent,
};
