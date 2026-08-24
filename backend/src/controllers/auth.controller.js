const { User } = require("../../models");

const {
  hashPassword,
  comparePassword,
  generateToken,
} = require("../services/auth.service");

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

module.exports = {
  register,
  login,
  me,
};