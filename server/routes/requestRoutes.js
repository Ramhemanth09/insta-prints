const express = require('express');
const router = express.Router();
const upload = require('../middleware/fileUpload');
const { verifyAdminToken } = require('../middleware/auth');
const {
  createRequest,
  trackRequest,
  userAcceptQuotation,
  getDashboardMetrics,
  getAllRequests,
  getRequestDetails,
  updateRequestStatus,
  setQuotation
} = require('../controllers/requestController');

// User Portal Routes (No signup required)
router.post('/submit', upload.array('files', 10), createRequest);
router.post('/track', trackRequest);
router.post('/accept-quotation', userAcceptQuotation);

// Admin Portal Routes (Strictly JWT Protected)
router.get('/admin/metrics', verifyAdminToken, getDashboardMetrics);
router.get('/admin/all', verifyAdminToken, getAllRequests);
router.get('/admin/detail/:requestId', verifyAdminToken, getRequestDetails);
router.put('/admin/status/:requestId', verifyAdminToken, updateRequestStatus);
router.post('/admin/quotation/:requestId', verifyAdminToken, setQuotation);

module.exports = router;
