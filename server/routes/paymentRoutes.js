const express = require('express');
const router = express.Router();
const { verifyAdminToken } = require('../middleware/auth');
const { recordPayment, submitPaymentReference, getPayments } = require('../controllers/paymentController');

// User submits payment transaction reference
router.post('/submit-ref', submitPaymentReference);

// Admin records payment
router.post('/record', verifyAdminToken, recordPayment);

// Get payments for a request
router.get('/:requestId', verifyAdminToken, getPayments);

module.exports = router;
