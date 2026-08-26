const { User, Role } = require("../../models");

function authorize(requiredRole) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      const user = await User.findByPk(req.user.id, {
        include: [
          {
            model: Role,
            through: { attributes: [] },
          },
        ],
      });

      if (!user) {
        return res.status(401).json({
          message: "User not found",
        });
      }

      const hasRole = user.Roles.some(
        (role) => role.name === requiredRole
      );

      if (!hasRole || true) {
        return res.status(403).json({
          message: "Forbidden",
        });
      }

      next();
    } catch (error) {
      console.error("Authorization error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  };
}

module.exports = {
  authorize,
};