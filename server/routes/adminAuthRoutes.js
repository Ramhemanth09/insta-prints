const express = require('express');
const router = express.Router();
const { adminLogin, getAdminProfile, getSecurityLogs } = require('../controllers/adminAuthController');
const { verifyAdminToken } = require('../middleware/auth');
const { adminLoginLimiter } = require('../middleware/rateLimiter');

// Rate limited single admin login endpoint
router.post('/login', adminLoginLimiter, adminLogin);

// Protected Admin routes
router.get('/profile', verifyAdminToken, getAdminProfile);
router.get('/security-logs', verifyAdminToken, getSecurityLogs);

module.exports = router;
