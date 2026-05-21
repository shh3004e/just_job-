const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage engine config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter validation
const fileFilter = (req, file, cb) => {
  const filetypes = {
    resume: /pdf/,
    photo: /jpeg|jpg|png|webp/,
    workSamples: /jpeg|jpg|png|webp/
  };

  const extname = filetypes[file.fieldname].test(
    path.extname(file.originalname).toLowerCase()
  );
  
  const mimetype = filetypes[file.fieldname].test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    if (file.fieldname === 'resume') {
      cb(new Error('Resume must be a PDF file only!'));
    } else {
      cb(new Error('Images must be of type jpeg, jpg, png, or webp only!'));
    }
  }
};

// Multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit per file
  },
  fileFilter: fileFilter
});

// Helper middleware to handle the multiple fields
const uploadProfileFiles = upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
  { name: 'workSamples', maxCount: 3 }
]);

module.exports = { uploadProfileFiles };
