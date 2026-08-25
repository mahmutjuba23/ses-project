const { User, Role, UserRole } = require("../../models");
const { logAction } = require("../services/audit.service");

async function manageUsersPage(req, res) {
  try {
    const users = await User.findAll({
      include: [{ model: Role, through: { attributes: [] } }],
      order: [['id', 'DESC']]
    });

    const allRoles = await Role.findAll();

    res.render("admin/users", {
      title: "Manage Users — SES",
      currentPage: "admin-users",
      users,
      allRoles,
      user: req.user
    });
  } catch (error) {
    console.error("Manage Users error:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function assignRole(req, res) {
  try {
    const { user_id, role_id } = req.body;
    
    // Check if role is already assigned
    const existing = await UserRole.findOne({ where: { user_id, role_id } });
    if (!existing) {
      await UserRole.create({ user_id, role_id });
      
      // Log the action
      await logAction({
        actor_user_id: req.user ? req.user.id : 1, // fallback to 1 if not fully auth mocked
        entity: "UserRole",
        entity_id: user_id,
        action: "ASSIGN_ROLE",
        new_value: { role_id },
        reason: "Admin manually assigned role from UI"
      });
    }

    res.redirect("/admin/users");
  } catch (error) {
    console.error("Assign Role error:", error);
    res.redirect("/admin/users?error=failed");
  }
}

async function removeRole(req, res) {
  try {
    const { user_id, role_id } = req.body;
    
    await UserRole.destroy({ where: { user_id, role_id } });
    
    await logAction({
      actor_user_id: req.user ? req.user.id : 1,
      entity: "UserRole",
      entity_id: user_id,
      action: "REVOKE_ROLE",
      old_value: { role_id },
      reason: "Admin manually revoked role from UI"
    });

    res.redirect("/admin/users");
  } catch (error) {
    console.error("Remove Role error:", error);
    res.redirect("/admin/users?error=failed");
  }
}

module.exports = {
  manageUsersPage,
  assignRole,
  removeRole
};
