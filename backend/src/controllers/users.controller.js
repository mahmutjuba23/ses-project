const { User } = require("../../models");
const { hashPassword } = require("../services/auth.service");

// ── API Handlers (JSON) ──

async function getUsers(req, res) {
  try {
    const users = await User.findAll({
      attributes: {
        exclude: ["password_hash"],
      },
    });

    return res.status(200).json({
      data: users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

async function getUserById(req, res) {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: {
        exclude: ["password_hash"],
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      data: user,
    });
  } catch (error) {
    console.error("Get user error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

async function createUser(req, res) {
  try {
    const { email, full_name, password } = req.body;

    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already exists",
      });
    }

    const password_hash = await hashPassword(password);

    const user = await User.create({
      email,
      full_name,
      password_hash,
    });

    return res.status(201).json({
      message: "User created successfully",
      data: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        is_active: user.is_active,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { email, full_name, password, is_active } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json({
          message: "Email already exists",
        });
      }

      user.email = email;
    }

    if (full_name !== undefined) {
      user.full_name = full_name;
    }

    if (is_active !== undefined) {
      user.is_active = is_active;
    }

    if (password) {
      user.password_hash = await hashPassword(password);
    }

    await user.save();

    return res.status(200).json({
      message: "User updated successfully",
      data: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        is_active: user.is_active,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    await user.destroy();

    return res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

// ── View Handlers (Pug) ──

async function usersPage(req, res) {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password_hash"] },
      order: [["id", "ASC"]],
    });

    res.render("users/index", {
      title: "Users — SES",
      metaDescription: "Manage all system users",
      currentPage: "users",
      users: users.map((u) => u.toJSON()),
      user: req.user,
    });
  } catch (error) {
    console.error("Users page error:", error);
    res.render("users/index", {
      title: "Users — SES",
      currentPage: "users",
      users: [],
      user: req.user,
      error: "Failed to load users",
    });
  }
}

async function userDetailPage(req, res) {
  try {
    const { id } = req.params;
    const userData = await User.findByPk(id, {
      attributes: { exclude: ["password_hash"] },
    });

    if (!userData) {
      return res.status(404).render("users/index", {
        title: "Users — SES",
        currentPage: "users",
        users: [],
        user: req.user,
        error: "User not found",
      });
    }

    res.render("users/show", {
      title: `${userData.full_name} — SES`,
      currentPage: "users",
      userData: userData.toJSON(),
      user: req.user,
    });
  } catch (error) {
    console.error("User detail page error:", error);
    res.redirect("/users");
  }
}

function createUserPage(req, res) {
  res.render("users/create", {
    title: "Create User — SES",
    currentPage: "users",
    user: req.user,
  });
}

async function createUserSubmit(req, res) {
  try {
    const { email, full_name, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.render("users/create", {
        title: "Create User — SES",
        currentPage: "users",
        user: req.user,
        error: "Email already exists",
        email,
        full_name,
      });
    }

    const password_hash = await hashPassword(password);
    await User.create({ email, full_name, password_hash });

    return res.redirect("/users");
  } catch (error) {
    console.error("Create user submit error:", error);
    return res.render("users/create", {
      title: "Create User — SES",
      currentPage: "users",
      user: req.user,
      error: "An unexpected error occurred",
    });
  }
}

async function editUserPage(req, res) {
  try {
    const { id } = req.params;
    const userData = await User.findByPk(id, {
      attributes: { exclude: ["password_hash"] },
    });

    if (!userData) {
      return res.redirect("/users");
    }

    res.render("users/edit", {
      title: `Edit ${userData.full_name} — SES`,
      currentPage: "users",
      userData: userData.toJSON(),
      user: req.user,
    });
  } catch (error) {
    console.error("Edit user page error:", error);
    res.redirect("/users");
  }
}

async function updateUserSubmit(req, res) {
  try {
    const { id } = req.params;
    const { email, full_name, password, is_active } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.redirect("/users");
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.render("users/edit", {
          title: `Edit ${user.full_name} — SES`,
          currentPage: "users",
          userData: { id: user.id, email, full_name: full_name || user.full_name, is_active: user.is_active },
          user: req.user,
          error: "Email already exists",
        });
      }
      user.email = email;
    }

    if (full_name !== undefined) {
      user.full_name = full_name;
    }

    if (is_active !== undefined) {
      user.is_active = is_active === "true";
    }

    if (password) {
      user.password_hash = await hashPassword(password);
    }

    await user.save();
    return res.redirect(`/users/${user.id}`);
  } catch (error) {
    console.error("Update user submit error:", error);
    res.redirect("/users");
  }
}

async function deleteUserPage(req, res) {
  try {
    const { id } = req.params;
    const userData = await User.findByPk(id, {
      attributes: { exclude: ["password_hash"] },
    });

    if (!userData) {
      return res.redirect("/users");
    }

    res.render("users/delete", {
      title: `Delete ${userData.full_name} — SES`,
      currentPage: "users",
      userData: userData.toJSON(),
      user: req.user,
    });
  } catch (error) {
    console.error("Delete user page error:", error);
    res.redirect("/users");
  }
}

async function deleteUserSubmit(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (user) {
      await user.destroy();
    }

    return res.redirect("/users");
  } catch (error) {
    console.error("Delete user submit error:", error);
    res.redirect("/users");
  }
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  usersPage,
  userDetailPage,
  createUserPage,
  createUserSubmit,
  editUserPage,
  updateUserSubmit,
  deleteUserPage,
  deleteUserSubmit,
};