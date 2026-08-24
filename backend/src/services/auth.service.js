const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    }
  );
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
};