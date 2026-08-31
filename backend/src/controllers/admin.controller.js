const { User, Role, UserRole, Student } = require("../../models");
const { logAction } = require("../services/audit.service");
const { hashPassword } = require("../services/auth.service");

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
      user: req.user,
      query: req.query
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

async function syncStudentsWithSIS(req, res) {
  try {
    // MOCK: In a real system, this would make an HTTP request to the University SIS API
    // e.g., const response = await axios.get("https://sis.university.edu/api/students?active=true", { headers: ... });
    // For now, we mock the response from the SIS
    const sisStudentsMock = [
      { first_name: "Alice", last_name: "Smith", student_number: "UNIV-2026-0101" },
      { first_name: "Bob", last_name: "Jones", student_number: "UNIV-2026-0102" },
      { first_name: "Charlie", last_name: "Brown", student_number: "UNIV-2026-0103" }
    ];

    let imported = 0;
    let skipped = 0;

    for (const sisStudent of sisStudentsMock) {
      const existing = await Student.findOne({ where: { student_number: sisStudent.student_number } });
      if (existing) {
        skipped++;
        continue;
      }

      const email = `${sisStudent.student_number.toLowerCase()}@student.ses.edu`;
      const password_hash = await hashPassword(`Ses@${sisStudent.student_number}`);

      const newUser = await User.create({
        email,
        full_name: `${sisStudent.first_name} ${sisStudent.last_name}`,
        password_hash,
        is_active: true,
      });

      await Student.create({
        user_id: newUser.id,
        student_number: sisStudent.student_number,
        first_name: sisStudent.first_name,
        last_name: sisStudent.last_name,
        email,
        is_active: true,
      });

      await logAction({
        actor_user_id: req.user ? req.user.id : 1,
        entity: "Student",
        entity_id: newUser.id,
        action: "SIS_SYNC",
        new_value: sisStudent,
        reason: "Auto-synced from SIS API",
      });

      imported++;
    }

    res.redirect(`/admin/students?success=sync&imported=${imported}&skipped=${skipped}`);
  } catch (error) {
    console.error("SIS Sync error:", error);
    res.redirect("/admin/students?error=sync_failed");
  }
}

async function listStudents(req, res) {
  try {
    const students = await Student.findAll({
      include: [{ model: User }],
      order: [['id', 'DESC']]
    });

    res.render("admin/students", {
      title: "Manage Students — SES",
      currentPage: "admin-students",
      students,
      user: req.user,
      query: req.query
    });
  } catch (error) {
    console.error("List Students error:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function viewStudentProfile(req, res) {
  try {
    const student = await Student.findByPk(req.params.id, {
      include: [
        { model: User },
        { model: require("../../models").PeriodEnrolment, include: [{ model: require("../../models").Period }] },
        { model: require("../../models").CallApplication, include: [{ model: require("../../models").Call }] }
      ]
    });

    if (!student) return res.status(404).send("Student not found");

    res.render("admin/student-profile", {
      title: `${student.first_name} ${student.last_name} — Profile`,
      currentPage: "admin-students",
      student,
      user: req.user
    });
  } catch (error) {
    console.error("View Student Profile error:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  manageUsersPage,
  assignRole,
  removeRole,
  syncStudentsWithSIS,
  listStudents,
  viewStudentProfile
};
