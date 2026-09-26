const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const FailedLoginLog = require('../models/FailedLoginLog');

const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || '';

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required.'
    });
  }

  try {
    const admin = await Admin.findOne({ email: email.trim().toLowerCase() });

    if (!admin) {
      // Log failed attempt
      await FailedLoginLog.create({
        emailAttempted: email,
        ip,
        userAgent,
        reason: 'Account not found'
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid administrative credentials.'
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      // Log failed attempt
      await FailedLoginLog.create({
        emailAttempted: email,
        ip,
        userAgent,
        reason: 'Incorrect password'
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid administrative credentials.'
      });
    }

    // Update last login
    admin.lastLoginAt = new Date();
    await admin.save();

    // Generate JWT short-lived token (4 hours)
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET || 'insta_prints_super_secure_jwt_secret_key_2026_x987y',
      { expiresIn: '4h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Admin authentication successful.',
      token,
      admin: {
        email: admin.email,
        lastLoginAt: admin.lastLoginAt
      }
    });
  } catch (err) {
    console.error('[Admin Login Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during administrative authentication.'
    });
  }
};

const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    }
    return res.status(200).json({
      success: true,
      admin
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getSecurityLogs = async (req, res) => {
  try {
    const logs = await FailedLoginLog.find().sort({ timestamp: -1 }).limit(50);
    return res.status(200).json({
      success: true,
      logs
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  adminLogin,
  getAdminProfile,
  getSecurityLogs
};
