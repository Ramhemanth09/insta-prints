const { Request, STATUS_ENUM } = require('../models/Request');
const StatusHistory = require('../models/StatusHistory');
const File = require('../models/File');
const Payment = require('../models/Payment');
const Message = require('../models/Message');

// Generate unique, clean Request ID
const generateRequestId = async () => {
  let isUnique = false;
  let candidateId = '';
  while (!isUnique) {
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const year = new Date().getFullYear();
    candidateId = `IP-${year}-${randomDigits}`;
    const exists = await Request.findOne({ requestId: candidateId });
    if (!exists) {
      isUnique = true;
    }
  }
  return candidateId;
};

// Normalize mobile number
const normalizeMobile = (mobile) => {
  if (!mobile) return '';
  return mobile.replace(/[^0-9]/g, '').slice(-10);
};

// ======================== USER ENDPOINTS ========================

const createRequest = async (req, res) => {
  try {
    const {
      name,
      rollNumber,
      branch,
      year,
      section,
      mobile,
      email,
      service,
      otherServiceExplanation,
      subject,
      requirements,
      deadline,
      specificInstructions
    } = req.body;

    if (!name || !rollNumber || !branch || !year || !section || !mobile || !service || !subject || !requirements || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields.'
      });
    }

    if (service === 'Other' && !otherServiceExplanation?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an explanation when selecting "Other" service.'
      });
    }

    const requestId = await generateRequestId();

    const newRequest = await Request.create({
      requestId,
      user: {
        name: name.trim(),
        rollNumber: rollNumber.trim().toUpperCase(),
        branch: branch.trim(),
        year: year.trim(),
        section: section.trim(),
        mobile: mobile.trim(),
        email: email ? email.trim().toLowerCase() : ''
      },
      service,
      otherServiceExplanation: otherServiceExplanation ? otherServiceExplanation.trim() : '',
      subject: subject.trim(),
      requirements: requirements.trim(),
      deadline: new Date(deadline).toISOString(),
      specificInstructions: specificInstructions ? specificInstructions.trim() : '',
      currentStatus: 'submitted',
      quotation: {
        totalAmount: 0,
        advanceAmount: 0,
        remainingAmount: 0,
        advancePercentage: 50,
        notes: '',
        sentAt: null,
        isAccepted: false,
        acceptedAt: null
      },
      paymentSummary: {
        advancePaid: false,
        advancePaidAmount: 0,
        advancePaidAt: null,
        remainingPaid: false,
        remainingPaidAmount: 0,
        remainingPaidAt: null,
        totalPaid: 0
      }
    });

    // Record initial status history
    await StatusHistory.create({
      requestId,
      status: 'submitted',
      note: 'Request created and submitted by user for review.',
      changedBy: 'user'
    });

    // Handle initial file uploads
    if (req.files && req.files.length > 0) {
      const fileRecords = req.files.map(file => ({
        requestId,
        uploadedBy: 'user',
        originalName: file.originalname,
        fileName: file.filename,
        fileType: file.originalname.split('.').pop()?.toUpperCase() || 'FILE',
        fileSize: file.size,
        fileCategory: 'user_submission',
        filePath: file.filename,
        mimeType: file.mimetype
      }));
      await File.insertMany(fileRecords);
    }

    return res.status(201).json({
      success: true,
      message: 'Your service request has been submitted successfully!',
      requestId,
      instruction: 'Please save your Request ID safely. It is your single access key to track status, chat with us, view quotations, and download completed work.'
    });
  } catch (err) {
    console.error('[Create Request Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create service request: ' + err.message
    });
  }
};

const trackRequest = async (req, res) => {
  try {
    const { requestId, mobileNumber } = req.body;

    if (!requestId || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'Request ID and registered mobile number are required for verification.'
      });
    }

    const cleanRequestId = requestId.trim().toUpperCase();
    const cleanMobile = normalizeMobile(mobileNumber);

    const requestDoc = await Request.findOne({ requestId: cleanRequestId });

    if (!requestDoc) {
      return res.status(404).json({
        success: false,
        message: 'No order found with the provided Request ID.'
      });
    }

    const userMobile = normalizeMobile(requestDoc.user.mobile);
    if (cleanMobile !== userMobile) {
      return res.status(403).json({
        success: false,
        message: 'Verification failed. Mobile number does not match the registered record for this Request ID.'
      });
    }

    const files = await File.find({ requestId: cleanRequestId }).sort({ createdAt: -1 });
    const statusHistory = await StatusHistory.find({ requestId: cleanRequestId }).sort({ changedAt: 1 });
    const payments = await Payment.find({ requestId: cleanRequestId }).sort({ recordedAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        request: requestDoc,
        files: Array.isArray(files) ? files : [],
        statusHistory: Array.isArray(statusHistory) ? statusHistory : [],
        payments: Array.isArray(payments) ? payments : []
      }
    });
  } catch (err) {
    console.error('[Track Request Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Error tracking request: ' + err.message
    });
  }
};

const userAcceptQuotation = async (req, res) => {
  try {
    const { requestId, mobileNumber } = req.body;

    const cleanRequestId = requestId.trim().toUpperCase();
    const cleanMobile = normalizeMobile(mobileNumber);

    const requestDoc = await Request.findOne({ requestId: cleanRequestId });

    if (!requestDoc) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    if (cleanMobile !== normalizeMobile(requestDoc.user.mobile)) {
      return res.status(403).json({ success: false, message: 'Verification failed.' });
    }

    if (!requestDoc.quotation.totalAmount || requestDoc.quotation.totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'No quotation has been issued yet.' });
    }

    requestDoc.quotation.isAccepted = true;
    requestDoc.quotation.acceptedAt = new Date().toISOString();
    requestDoc.currentStatus = 'awaiting_advance_payment';
    await requestDoc.save();

    await StatusHistory.create({
      requestId: cleanRequestId,
      status: 'awaiting_advance_payment',
      note: `Quotation accepted by user (Total: ₹${requestDoc.quotation.totalAmount}, Advance required: ₹${requestDoc.quotation.advanceAmount}). Awaiting advance payment.`,
      changedBy: 'user'
    });

    return res.status(200).json({
      success: true,
      message: 'Quotation accepted! Please proceed with advance payment to confirm your order.',
      quotation: requestDoc.quotation,
      currentStatus: requestDoc.currentStatus
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ======================== ADMIN ENDPOINTS ========================

const getDashboardMetrics = async (req, res) => {
  try {
    const totalRequests = await Request.countDocuments();
    const newRequests = await Request.countDocuments({ currentStatus: { $in: ['submitted', 'under_review'] } });
    const pendingPayments = await Request.countDocuments({ currentStatus: { $in: ['awaiting_advance_payment', 'awaiting_remaining_payment'] } });
    const activeOrders = await Request.countDocuments({ currentStatus: { $in: ['confirmed', 'work_in_progress', 'review_or_revision', 'ready_for_final_delivery'] } });
    const completedOrders = await Request.countDocuments({ currentStatus: 'completed' });
    const cancelledOrders = await Request.countDocuments({ currentStatus: 'cancelled' });

    const payments = await Payment.find({ status: 'paid' });
    const paymentsList = Array.isArray(payments) ? payments : [];
    const totalRevenue = paymentsList.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);

    return res.status(200).json({
      success: true,
      metrics: {
        totalRequests,
        newRequests,
        pendingPayments,
        activeOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getAllRequests = async (req, res) => {
  try {
    const { search, status, service, branch, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.currentStatus = status;
    }

    if (service && service !== 'all') {
      query.service = service;
    }

    if (branch && branch !== 'all') {
      query['user.branch'] = new RegExp(branch, 'i');
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { requestId: regex },
        { 'user.name': regex },
        { 'user.rollNumber': regex },
        { 'user.mobile': regex },
        { subject: regex }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const requests = await Request.find(query).sort(sortOptions);

    return res.status(200).json({
      success: true,
      count: Array.isArray(requests) ? requests.length : 0,
      requests: Array.isArray(requests) ? requests : []
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getRequestDetails = async (req, res) => {
  try {
    const { requestId } = req.params;
    const cleanRequestId = requestId.trim().toUpperCase();

    const requestDoc = await Request.findOne({ requestId: cleanRequestId });
    if (!requestDoc) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const files = await File.find({ requestId: cleanRequestId }).sort({ createdAt: -1 });
    const statusHistory = await StatusHistory.find({ requestId: cleanRequestId }).sort({ changedAt: 1 });
    const payments = await Payment.find({ requestId: cleanRequestId }).sort({ recordedAt: -1 });
    const messages = await Message.find({ requestId: cleanRequestId }).sort({ timestamp: 1 });

    return res.status(200).json({
      success: true,
      data: {
        request: requestDoc,
        files: Array.isArray(files) ? files : [],
        statusHistory: Array.isArray(statusHistory) ? statusHistory : [],
        payments: Array.isArray(payments) ? payments : [],
        messages: Array.isArray(messages) ? messages : []
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, note } = req.body;

    if (!STATUS_ENUM.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status "${status}". Allowed statuses: ${STATUS_ENUM.join(', ')}`
      });
    }

    const cleanRequestId = requestId.trim().toUpperCase();
    const requestDoc = await Request.findOne({ requestId: cleanRequestId });

    if (!requestDoc) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const previousStatus = requestDoc.currentStatus;
    requestDoc.currentStatus = status;
    await requestDoc.save();

    const historyEntry = await StatusHistory.create({
      requestId: cleanRequestId,
      status,
      note: note || `Status updated from "${previousStatus}" to "${status}" by Admin.`,
      changedBy: 'admin'
    });

    return res.status(200).json({
      success: true,
      message: `Status successfully changed to "${status}".`,
      currentStatus: status,
      historyEntry
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const setQuotation = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { totalAmount, advancePercentage = 50, notes, autoUpdateStatus = true } = req.body;

    const total = parseFloat(totalAmount);
    const advPct = Math.max(50, Math.min(100, parseFloat(advancePercentage) || 50));

    if (isNaN(total) || total <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quotation total amount must be a positive number.'
      });
    }

    const advanceAmount = Math.round((total * advPct) / 100);
    const remainingAmount = total - advanceAmount;

    const cleanRequestId = requestId.trim().toUpperCase();
    const requestDoc = await Request.findOne({ requestId: cleanRequestId });

    if (!requestDoc) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    requestDoc.quotation = {
      totalAmount: total,
      advanceAmount,
      remainingAmount,
      advancePercentage: advPct,
      notes: notes ? notes.trim() : '',
      sentAt: new Date().toISOString(),
      isAccepted: false,
      acceptedAt: null
    };

    if (autoUpdateStatus) {
      requestDoc.currentStatus = 'quotation_sent';
    }

    await requestDoc.save();

    await StatusHistory.create({
      requestId: cleanRequestId,
      status: requestDoc.currentStatus,
      note: `Quotation issued: Total ₹${total} (Advance ${advPct}% = ₹${advanceAmount}, Remaining = ₹${remainingAmount}). ${notes ? 'Note: ' + notes : ''}`,
      changedBy: 'admin'
    });

    return res.status(200).json({
      success: true,
      message: 'Quotation created and sent successfully.',
      quotation: requestDoc.quotation,
      currentStatus: requestDoc.currentStatus
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createRequest,
  trackRequest,
  userAcceptQuotation,
  getDashboardMetrics,
  getAllRequests,
  getRequestDetails,
  updateRequestStatus,
  setQuotation
};
