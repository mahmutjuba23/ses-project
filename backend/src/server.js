const express = require("express");

const app = express();

const PORT = 3010;

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "SES API is running",
  });
});

app.listen(PORT, () => {
  console.log(`SES API running on http://localhost:${PORT}`);
});