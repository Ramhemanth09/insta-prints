const path = require('path');
const fs = require('fs');
const File = require('../models/File');
const { Request } = require('../models/Request');
const StatusHistory = require('../models/StatusHistory');

const uploadDir = path.resolve(__dirname, '../uploads');

// Upload files for a request (User or Admin)
const uploadFiles = async (req, res) => {
  try {
    const { requestId, fileCategory = 'user_submission', mobileNumber } = req.body;

    if (!requestId) {
      return res.status(400).json({ success: false, message: 'Request ID is required.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded.' });
    }

    const cleanRequestId = requestId.trim().toUpperCase();
    const requestDoc = await Request.findOne({ requestId: cleanRequestId });

    if (!requestDoc) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    // Determine uploader role
    const isUser = !req.admin;
    const uploadedBy = isUser ? 'user' : 'admin';

    // If user upload, verify mobile
    if (isUser) {
      const cleanMobile = mobileNumber ? mobileNumber.replace(/[^0-9]/g, '').slice(-10) : '';
      const reqMobile = requestDoc.user.mobile.replace(/[^0-9]/g, '').slice(-10);
      if (cleanMobile !== reqMobile) {
        return res.status(403).json({ success: false, message: 'Unauthorized. Mobile verification failed.' });
      }
    }

    const fileRecords = req.files.map(file => ({
      requestId: cleanRequestId,
      uploadedBy,
      originalName: file.originalname,
      fileName: file.filename,
      fileType: file.originalname.split('.').pop()?.toUpperCase() || 'FILE',
      fileSize: file.size,
      fileCategory: fileCategory || (isUser ? 'user_submission' : 'admin_deliverable'),
      filePath: file.filename,
      mimeType: file.mimetype
    }));

    const savedFiles = await File.insertMany(fileRecords);

    // If admin uploaded final deliverables or previews, record status note
    if (!isUser) {
      const catLabel = fileCategory === 'admin_deliverable' ? 'Final Deliverable(s)' : 'Work Preview / Proof(s)';
      await StatusHistory.create({
        requestId: cleanRequestId,
        status: requestDoc.currentStatus,
        note: `Admin uploaded ${req.files.length} file(s) [${catLabel}]: ${req.files.map(f => f.originalname).join(', ')}`,
        changedBy: 'admin'
      });
    }

    return res.status(201).json({
      success: true,
      message: `${req.files.length} file(s) uploaded successfully.`,
      files: savedFiles
    });
  } catch (err) {
    console.error('[Upload Files Error]:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Secure file download/view
const getSecureFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { requestId, mobileNumber, adminToken } = req.query;

    const fileDoc = await File.findById(fileId);
    if (!fileDoc) {
      return res.status(404).json({ success: false, message: 'File record not found.' });
    }

    const cleanRequestId = fileDoc.requestId;
    const requestDoc = await Request.findOne({ requestId: cleanRequestId });
    if (!requestDoc) {
      return res.status(404).json({ success: false, message: 'Associated request not found.' });
    }

    // Check authorization: Either Admin Token OR Request ID + Mobile match
    let isAuthorized = false;

    if (req.admin) {
      isAuthorized = true;
    } else if (adminToken) {
      try {
        const jwt = require('jsonwebtoken');
        jwt.verify(adminToken, process.env.JWT_SECRET || 'insta_prints_super_secure_jwt_secret_key_2026_x987y');
        isAuthorized = true;
      } catch (e) {
        // invalid token, check mobile next
      }
    }

    if (!isAuthorized && requestId && mobileNumber) {
      const cleanMobile = mobileNumber.replace(/[^0-9]/g, '').slice(-10);
      const reqMobile = requestDoc.user.mobile.replace(/[^0-9]/g, '').slice(-10);
      if (requestId.trim().toUpperCase() === cleanRequestId && cleanMobile === reqMobile) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden. You do not have permission to access this secure file.'
      });
    }

    const absolutePath = path.resolve(uploadDir, fileDoc.filePath);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, message: 'Physical file not found on server.' });
    }

    // Set proper headers to prevent indexing and caching of sensitive files
    res.setHeader('Content-Type', fileDoc.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileDoc.originalName)}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

    const fileStream = fs.createReadStream(absolutePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error('[Download File Error]:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  uploadFiles,
  getSecureFile
};
