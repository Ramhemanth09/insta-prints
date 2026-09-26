const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed extensions whitelist
const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.dwg', '.dxf', '.doc', '.docx', '.ppt', '.pptx',
  '.xls', '.xlsx', '.zip', '.rar', '.7z', '.txt',
  '.png', '.jpg', '.jpeg', '.webp', '.svg'
]);

// Explicitly blocked extensions
const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.msi', '.vbs', '.js', '.jar', '.com', '.scr', '.pif', '.hta'
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const randomHex = crypto.randomBytes(12).toString('hex');
    const safeName = `${Date.now()}_${randomHex}${ext}`;
    cb(null, safeName);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return cb(new Error(`File type "${ext}" is blocked for security reasons.`), false);
  }

  if (ALLOWED_EXTENSIONS.has(ext)) {
    return cb(null, true);
  }

  return cb(new Error(`Unsupported file type "${ext}". Allowed types: PDF, DWG, DXF, DOC/DOCX, PPT/PPTX, XLS/XLSX, ZIP/RAR, Images (PNG, JPG, WEBP).`), false);
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max per file
    files: 10 // Max 10 files per upload
  },
  fileFilter: fileFilter
});

module.exports = upload;
