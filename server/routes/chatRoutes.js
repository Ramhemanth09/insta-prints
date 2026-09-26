const express = require('express');
const router = express.Router();
const { verifyAdminToken } = require('../middleware/auth');
const { getMessages, sendMessage } = require('../controllers/chatController');

// Optional admin middleware
const optionalAdminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifyAdminToken(req, res, next);
  }
  next();
};

router.get('/:requestId', optionalAdminAuth, getMessages);
router.post('/:requestId/send', optionalAdminAuth, sendMessage);

module.exports = router;
