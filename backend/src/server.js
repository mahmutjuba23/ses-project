require("dotenv").config();

const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const scholarshipsRoutes = require("./routes/scholarships.routes");
const authViewRoutes = require("./routes/authView.routes");
const usersViewRoutes = require("./routes/usersView.routes");
const scholarshipsViewRoutes = require("./routes/scholarshipsView.routes");
const sequelize = require("./config/database");

const app = express();

// ── View engine setup ──
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// ── Middleware ──
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── API routes (JSON) ──
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/scholarships", scholarshipsRoutes);

// ── View routes (Pug) ──
app.use("/auth", authViewRoutes);
app.use("/users", usersViewRoutes);
app.use("/scholarships", scholarshipsViewRoutes);

// ── Root redirect ──
app.get("/", (req, res) => {
  res.redirect("/auth/login");
});

const PORT = process.env.PORT;

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "SES API is running",
  });
});

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("Database connection established.");

    app.listen(PORT, () => {
      console.log(`SES API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error.message);
  }
}

startServer();