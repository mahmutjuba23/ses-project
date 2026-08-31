const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../../uploads/resumes");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter (PDF only for now as per plan)
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed!"), false);
  }
};

// Initialize multer for Resumes (PDFs to disk)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  },
});

// Initialize multer for Excel Imports (to memory)
const excelUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || 
        file.mimetype === "application/vnd.ms-excel" ||
        file.mimetype === "text/csv") {
      cb(null, true);
    } else {
      cb(new Error("Only Excel/CSV files are allowed!"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit for spreadsheets
  }
});

module.exports = {
  upload,
  excelUpload,
};
