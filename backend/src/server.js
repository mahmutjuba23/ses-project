require("dotenv").config();

const express = require("express");

const app = express();

const PORT = process.env.PORT;

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "SES API is running",
  });
});

app.listen(PORT, () => {
  console.log(`SES API running on http://localhost:${PORT}`);
});