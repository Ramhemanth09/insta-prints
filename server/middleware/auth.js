const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const verifyAdminToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is malformed.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'insta_prints_super_secure_jwt_secret_key_2026_x987y');
    
    // Validate that the admin still exists in the DB
    const admin = await Admin.findOne({ email: decoded.email?.toLowerCase() });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token: Admin account not found.'
      });
    }

    req.admin = {
      id: admin._id,
      email: admin.email
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid or forged authentication token.'
    });
  }
};

module.exports = {
  verifyAdminToken
};
