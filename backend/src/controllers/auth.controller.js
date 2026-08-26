const { User, Role, Student } = require("../../models");

const {
  hashPassword,
  comparePassword,
  generateToken,
} = require("../services/auth.service");

// ── API Handlers (JSON) ──

async function register(req, res) {
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
      message: "User registered successfully",
      data: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordValid = await comparePassword(
      password,
      user.password_hash
    );

    if (!passwordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

async function me(req, res) {
  return res.status(200).json({
    data: req.user,
  });
}

// ── View Handlers (Pug) ──

function loginPage(req, res) {
  res.render("auth/login", {
    title: "Sign In — SES",
    metaDescription: "Sign in to the Scholarship Engagement System",
    currentPage: "login",
  });
}

function registerPage(req, res) {
  res.render("auth/register", {
    title: "Create Account — SES",
    metaDescription: "Create a new SES account",
    currentPage: "register",
  });
}

async function loginSubmit(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ 
      where: { email },
      include: [{ model: Role, through: { attributes: [] } }]
    });

    if (!user) {
      return res.render("auth/login", {
        title: "Sign In — SES",
        currentPage: "login",
        error: "Invalid email or password",
        email,
      });
    }

    const passwordValid = await comparePassword(password, user.password_hash);

    if (!passwordValid) {
      return res.render("auth/login", {
        title: "Sign In — SES",
        currentPage: "login",
        error: "Invalid email or password",
        email,
      });
    }

    const token = generateToken(user);

    // Store token in a cookie for view-based auth
    res.cookie("token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    
    // Redirect based on role
    const isAdminOrReviewer = user.Roles && user.Roles.some(r => r.name === 'admin' || r.name === 'reviewer');
    if (isAdminOrReviewer) {
      return res.redirect("/dashboard");
    } else {
      return res.redirect("/scholarships");
    }
  } catch (error) {
    console.error("Login view error:", error);
    return res.render("auth/login", {
      title: "Sign In — SES",
      currentPage: "login",
      error: "An unexpected error occurred",
    });
  }
}

async function mockGoogleLogin(req, res) {
  try {
    // For testing, we log in as the default admin
    const email = "admin@ses.com";
    const user = await User.findOne({ 
      where: { email },
      include: [{ model: Role, through: { attributes: [] } }]
    });

    if (!user) {
      return res.render("auth/login", {
        title: "Sign In — SES",
        currentPage: "login",
        error: "Mock user not found in DB. Run seeds.",
      });
    }

    // Link to Student record if it exists and isn't linked yet
    const student = await Student.findOne({ where: { email: user.email } });
    if (student && !student.user_id) {
      student.user_id = user.id;
      await student.save();
      console.log(`Linked User ${user.id} to Student ${student.id}`);
    }

    const token = generateToken(user);
    res.cookie("token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    
    return res.redirect("/dashboard");
  } catch (error) {
    console.error("Mock Google Login error:", error);
    return res.redirect("/auth/login");
  }
}

async function mockStudentLogin(req, res) {
  try {
    // For testing, we log in as the default student (Maria Garcia)
    const email = "maria.garcia@ses.com";
    const user = await User.findOne({ 
      where: { email },
      include: [{ model: Role, through: { attributes: [] } }]
    });

    if (!user) {
      return res.render("auth/login", {
        title: "Sign In — SES",
        currentPage: "login",
        error: "Mock student not found in DB. Run seeds.",
      });
    }

    // Ensure student record is linked properly
    const student = await Student.findOne({ where: { email: user.email } });
    if (student && !student.user_id) {
      student.user_id = user.id;
      await student.save();
    }

    const token = generateToken(user);
    res.cookie("token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    
    return res.redirect("/calls"); // Students go directly to Available Calls
  } catch (error) {
    console.error("Mock Student Login error:", error);
    return res.redirect("/auth/login");
  }
}

async function registerSubmit(req, res) {
  try {
    const { email, full_name, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.render("auth/register", {
        title: "Create Account — SES",
        currentPage: "register",
        error: "Email already exists",
        email,
        full_name,
      });
    }

    const password_hash = await hashPassword(password);

    await User.create({ email, full_name, password_hash });

    return res.redirect("/auth/login");
  } catch (error) {
    console.error("Register view error:", error);
    return res.render("auth/register", {
      title: "Create Account — SES",
      currentPage: "register",
      error: "An unexpected error occurred",
    });
  }
}

async function profilePage(req, res) {
  res.render("auth/profile", {
    title: "My Profile — SES",
    metaDescription: "Your SES account profile",
    currentPage: "profile",
    user: req.user,
  });
}

module.exports = {
  register,
  login,
  me,
  loginPage,
  registerPage,
  loginSubmit,
  registerSubmit,
  profilePage,
  mockGoogleLogin,
  mockStudentLogin,
};