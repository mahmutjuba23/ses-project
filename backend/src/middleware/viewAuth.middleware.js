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

module.exports = {
  authenticateView,
};
