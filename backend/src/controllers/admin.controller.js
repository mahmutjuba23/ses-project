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
      // User requested that only ONE role can be assigned at a time.
      // So, remove all existing roles for this user first.
      await UserRole.destroy({ where: { user_id } });
      
      // Then create the new one
      await UserRole.create({ user_id, role_id });
      
      // Log the action
      await logAction({
        actor_user_id: req.user ? req.user.id : 1, // fallback to 1 if not fully auth mocked
        entity: "UserRole",
        entity_id: user_id,
        action: "ASSIGN_ROLE",
        new_value: { role_id },
        reason: "Admin manually assigned role from UI (replacing old roles)"
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

const xlsx = require("xlsx");

async function importStudentsExcel(req, res) {
  try {
    if (!req.file) {
      return res.redirect("/admin/students?error=no_file");
    }

    // Read the uploaded file buffer
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (!data || data.length === 0) {
      return res.redirect("/admin/students?error=empty_file");
    }

    let imported = 0;
    let skipped = 0;

    for (const row of data) {
      // Expecting columns: 'First Name', 'Last Name', 'Student ID'
      const firstName = row["First Name"];
      const lastName = row["Last Name"];
      const studentId = row["Student ID"];

      if (!firstName || !lastName || !studentId) {
        skipped++;
        continue;
      }

      // Check for existing
      const existing = await Student.findOne({ where: { student_number: String(studentId) } });
      if (existing) {
        skipped++;
        continue;
      }

      const email = `${String(studentId).toLowerCase()}@student.ses.edu`;
      // All imported students share the same default password.
      // Admins should advise students to change it after first login.
      const password_hash = await hashPassword(`Student@SES2026`);

      const newUser = await User.create({
        email,
        full_name: `${firstName} ${lastName}`,
        password_hash,
        is_active: true,
      });

      await Student.create({
        user_id: newUser.id,
        student_number: String(studentId),
        first_name: firstName,
        last_name: lastName,
        email,
        is_active: true,
      });

      const studentRole = await Role.findOne({ where: { name: 'student' } });
      if (studentRole) {
        await newUser.addRole(studentRole);
      }

      await logAction({
        actor_user_id: req.user ? req.user.id : 1,
        entity: "Student",
        entity_id: newUser.id,
        action: "EXCEL_IMPORT",
        new_value: { firstName, lastName, studentId },
        reason: "Imported via Excel upload",
      });

      imported++;
    }

    res.redirect(`/admin/students?success=import&imported=${imported}&skipped=${skipped}`);
  } catch (error) {
    console.error("Excel Import error:", error);
    res.redirect("/admin/students?error=import_failed");
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
        { 
          model: require("../../models").CallApplication, 
          include: [
            { 
              model: require("../../models").Call, 
              include: [
                { model: require("../../models").TaskType },
                { 
                  model: require("../../models").Event, 
                  include: [{ model: require("../../models").Period }] 
                }
              ] 
            }
          ] 
        }
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
  importStudentsExcel,
  listStudents,
  viewStudentProfile
};
