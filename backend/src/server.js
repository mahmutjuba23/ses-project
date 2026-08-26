require("dotenv").config();

const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const winston = require("winston");

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const scholarshipsRoutes = require("./routes/scholarships.routes");
const applicationsRoutes = require("./routes/applications.routes");
const studentsRoutes = require("./routes/students.routes");
const authViewRoutes = require("./routes/authView.routes");
const usersViewRoutes = require("./routes/usersView.routes");
const scholarshipsViewRoutes = require("./routes/scholarshipsView.routes");
const applicationsViewRoutes = require("./routes/applicationsView.routes");
const adminViewRoutes = require("./routes/adminView.routes");
const callsViewRoutes = require("./routes/callsView.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const sequelize = require("./config/database");

const app = express();

// ── View engine setup ──
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// ── Static Files ──
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ── Middleware ──
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("combined", { stream: { write: message => logger.info(message.trim()) } }));

// ── API routes (JSON) ──
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/scholarships", scholarshipsRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/students", studentsRoutes);

// ── View routes (Pug) ──
app.use("/auth", authViewRoutes);
app.use("/users", usersViewRoutes);
app.use("/scholarships", scholarshipsViewRoutes);
app.use("/applications", applicationsViewRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/admin", adminViewRoutes);
app.use("/calls", callsViewRoutes);

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
    logger.info("Database connection established.");

    app.listen(PORT, () => {
      logger.info(`SES API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error("Unable to connect to the database:", error.message);
  }
}

startServer();