const multer = require("multer");
const path = require("path");
const fs = require("fs"); // Import fs

// Ensure the directory exists
const uploadDir = path.join(__dirname, "../../uploads/excel"); // Adjust ".." based on your folder structure
// OR simply use relative path if running from root:
// const uploadDir = "uploads/excel"; 

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use the variable we defined above
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `excel-${Date.now()}${ext}`);
  },
});

// File filter (only Excel)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /xlsx|xls|csv/; // Added csv just in case
  const ext = path.extname(file.originalname).toLowerCase();
  
  // improved regex check for extension
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only Excel files (.xlsx, .xls) are allowed"));
  }
};

// Multer upload
const uploadExcel = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

module.exports = uploadExcel;