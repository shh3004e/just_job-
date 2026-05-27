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
    photo: /jpeg|jpg/,
    workSamples: /jpeg|jpg|png|webp/,
    projectFile0: /jpeg|jpg|png|webp|pdf|zip|doc|docx|rar|txt|mp4|mov|avi|mkv/,
    projectFile1: /jpeg|jpg|png|webp|pdf|zip|doc|docx|rar|txt|mp4|mov|avi|mkv/,
    projectFile2: /jpeg|jpg|png|webp|pdf|zip|doc|docx|rar|txt|mp4|mov|avi|mkv/,
    projectFile3: /jpeg|jpg|png|webp|pdf|zip|doc|docx|rar|txt|mp4|mov|avi|mkv/
  };

  const regex = filetypes[file.fieldname];
  if (!regex) {
    return cb(null, true); // accept other fields if they aren't restricted
  }

  const extname = regex.test(
    path.extname(file.originalname).toLowerCase()
  );
  
  const mimetype = regex.test(file.mimetype);

  if (extname || mimetype) {
    return cb(null, true);
  } else {
    if (file.fieldname === 'resume') {
      cb(new Error('Resume must be a PDF file only!'));
    } else if (file.fieldname === 'photo') {
      cb(new Error('Profile photo must be a JPG/JPEG file only!'));
    } else {
      cb(new Error('Invalid file type for ' + file.fieldname));
    }
  }
};

// Multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit per file
  },
  fileFilter: fileFilter
});

// Helper middleware to handle the multiple fields
const uploadProfileFiles = upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
  { name: 'workSamples', maxCount: 3 },
  { name: 'projectFile0', maxCount: 1 },
  { name: 'projectFile1', maxCount: 1 },
  { name: 'projectFile2', maxCount: 1 },
  { name: 'projectFile3', maxCount: 1 }
]);

module.exports = { uploadProfileFiles };
