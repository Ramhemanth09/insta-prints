const express = require('express');
const router = express.Router();
const upload = require('../middleware/fileUpload');
const { verifyAdminToken } = require('../middleware/auth');
const { uploadFiles, getSecureFile } = require('../controllers/fileController');

// Optional admin middleware check for upload route
const optionalAdminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifyAdminToken(req, res, next);
  }
  next();
};

// Upload endpoint (Handles user submissions and admin deliverable uploads)
router.post('/upload', optionalAdminAuth, upload.array('files', 10), uploadFiles);

// Secure file access endpoint (protected by either admin JWT or valid RequestID + Mobile)
router.get('/secure/:fileId', optionalAdminAuth, getSecureFile);

module.exports = router;
