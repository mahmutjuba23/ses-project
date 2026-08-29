const { User, Role, UserRole, Student } = require("../../models");
const { logAction } = require("../services/audit.service");
const { hashPassword } = require("../services/auth.service");
const xlsx = require("xlsx");
const multer = require("multer");
const path = require("path");
const os = require("os");

// Configure multer to use system temp dir
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = [".xlsx", ".xls"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error("Only .xlsx or .xls files are allowed"));
  },
});


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


function importStudentsPage(req, res) {
  const { imported, skipped, errors: errList } = req.query;
  res.render("admin/import-students", {
    title: "Import Students — SES",
    currentPage: "admin-users",
    user: req.user,
    imported: imported ? Number(imported) : null,
    skipped: skipped ? Number(skipped) : null,
    errList: errList ? JSON.parse(decodeURIComponent(errList)) : null,
  });
}

async function importStudentsSubmit(req, res) {
  try {
    if (!req.file) {
      return res.redirect("/admin/students/import?error=no_file");
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    let imported = 0;
    let skipped = 0;
    const errorRows = [];

    // Accept flexible column names (case-insensitive)
    const normalize = (obj) => {
      const out = {};
      for (const [k, v] of Object.entries(obj)) {
        out[k.trim().toLowerCase().replace(/\s+/g, "_")] = String(v).trim();
      }
      return out;
    };

    const resolveField = (row, ...candidates) => {
      for (const c of candidates) {
        if (row[c] !== undefined && row[c] !== "") return row[c];
      }
      return "";
    };

    for (let i = 0; i < rows.length; i++) {
      const row = normalize(rows[i]);
      const rowNum = i + 2; // Excel row number (header = 1)

      const first_name    = resolveField(row, "name", "first_name", "firstname");
      const last_name     = resolveField(row, "surname", "last_name", "lastname");
      const student_id    = resolveField(row, "student_id", "studentid", "student_number");
      const university_id = resolveField(row, "personal_university_id", "university_id", "universityid", "university_number");

      if (!first_name || !last_name || !university_id) {
        errorRows.push(`Row ${rowNum}: missing required fields (name, surname, or university ID)`);
        skipped++;
        continue;
      }

      // Check for existing student by university_id (student_number)
      const existing = await Student.findOne({ where: { student_number: university_id } });
      if (existing) {
        skipped++;
        continue;
      }

      // Build a placeholder email from university_id
      const email = `${university_id.toLowerCase().replace(/\s+/g, "")}@student.ses.edu`;

      // Create linked User account with a temporary password
      const tempPassword = `Ses@${university_id}`;
      const password_hash = await hashPassword(tempPassword);

      const newUser = await User.create({
        email,
        full_name: `${first_name} ${last_name}`,
        password_hash,
        is_active: true,
      });

      await Student.create({
        user_id: newUser.id,
        student_number: university_id,
        first_name,
        last_name,
        email,
        is_active: true,
      });

      await logAction({
        actor_user_id: req.user ? req.user.id : 1,
        entity: "Student",
        entity_id: newUser.id,
        action: "BULK_IMPORT",
        new_value: { university_id, first_name, last_name },
        reason: "Admin bulk imported student from Excel",
      });

      imported++;
    }

    const errParam = errorRows.length
      ? `&errors=${encodeURIComponent(JSON.stringify(errorRows))}`
      : "";

    return res.redirect(
      `/admin/students/import?imported=${imported}&skipped=${skipped}${errParam}`
    );
  } catch (err) {
    console.error("Import students error:", err);
    return res.redirect("/admin/students/import?error=parse_failed");
  }
}

module.exports = {
  manageUsersPage,
  assignRole,
  removeRole,
  importStudentsPage,
  importStudentsSubmit,
  uploadMiddleware: upload.single("excel_file"),
};

