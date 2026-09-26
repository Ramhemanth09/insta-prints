const Message = require('../models/Message');
const { Request } = require('../models/Request');

// Normalize mobile
const normalizeMobile = (m) => (m ? m.replace(/[^0-9]/g, '').slice(-10) : '');

// Get all messages for a Request ID
const getMessages = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { mobileNumber } = req.query;

    if (!requestId) {
      return res.status(400).json({ success: false, message: 'Request ID is required.' });
    }

    const cleanRequestId = requestId.trim().toUpperCase();
    const requestDoc = await Request.findOne({ requestId: cleanRequestId });

    if (!requestDoc) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    // If request is from user, verify mobile
    if (!req.admin) {
      if (!mobileNumber || normalizeMobile(mobileNumber) !== normalizeMobile(requestDoc.user.mobile)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized. Mobile verification failed for this Request ID chat thread.'
        });
      }
    }

    const messages = await Message.find({ requestId: cleanRequestId }).sort({ timestamp: 1 });

    return res.status(200).json({
      success: true,
      messages
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Send message
const sendMessage = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { text, mobileNumber, attachmentUrl, attachmentName, attachmentType } = req.body;

    if (!requestId) {
      return res.status(400).json({ success: false, message: 'Request ID is required.' });
    }

    if ((!text || !text.trim()) && !attachmentUrl) {
      return res.status(400).json({ success: false, message: 'Message text or attachment is required.' });
    }

    const cleanRequestId = requestId.trim().toUpperCase();
    const requestDoc = await Request.findOne({ requestId: cleanRequestId });

    if (!requestDoc) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const isUser = !req.admin;
    const sender = isUser ? 'user' : 'admin';

    // Verify user identity
    if (isUser) {
      if (!mobileNumber || normalizeMobile(mobileNumber) !== normalizeMobile(requestDoc.user.mobile)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized. Mobile verification failed.'
        });
      }
    }

    const message = new Message({
      requestId: cleanRequestId,
      sender,
      text: text ? text.trim() : '',
      attachmentUrl: attachmentUrl || null,
      attachmentName: attachmentName || null,
      attachmentType: attachmentType || null,
      timestamp: new Date()
    });

    await message.save();

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully.',
      data: message
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getMessages,
  sendMessage
};
