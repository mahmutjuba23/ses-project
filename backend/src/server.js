require("dotenv").config();

const express = require("express");
const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const sequelize = require("./config/database");

const app = express();
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

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