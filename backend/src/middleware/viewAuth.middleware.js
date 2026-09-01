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
 * Middleware: optionally authenticates the user from a cookie.
 * If a valid token exists, sets req.user. If not, continues silently.
 * Used for public pages (like Scholarships) that logged-in users should see the full sidebar on.
 */
function optionalAuth(req, res, next) {
  const token = req.cookies && req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (_) {
      // Invalid/expired token — just continue as guest
    }
  }
  next();
}


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
  optionalAuth,
  isAdmin,
  isStudent,
};
