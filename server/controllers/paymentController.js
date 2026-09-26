const Payment = require('../models/Payment');
const { Request } = require('../models/Request');
const StatusHistory = require('../models/StatusHistory');

// Record a payment (Admin)
const recordPayment = async (req, res) => {
  try {
    const { requestId, amount, type, status = 'paid', transactionRef, paymentMethod = 'Manual UPI / Cash', notes } = req.body;

    if (!requestId || !amount || !type) {
      return res.status(400).json({
        success: false,
        message: 'Request ID, amount, and payment type (advance/remaining/full) are required.'
      });
    }

    const cleanRequestId = requestId.trim().toUpperCase();
    const requestDoc = await Request.findOne({ requestId: cleanRequestId });

    if (!requestDoc) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount.' });
    }

    const payment = await Payment.create({
      requestId: cleanRequestId,
      amount: paymentAmount,
      type,
      status,
      transactionRef: transactionRef ? transactionRef.trim() : '',
      paymentMethod,
      notes: notes ? notes.trim() : '',
      recordedBy: 'admin',
      recordedAt: new Date().toISOString()
    });

    // Update Request payment summary & status
    if (status === 'paid') {
      if (!requestDoc.paymentSummary) {
        requestDoc.paymentSummary = {
          advancePaid: false,
          advancePaidAmount: 0,
          advancePaidAt: null,
          remainingPaid: false,
          remainingPaidAmount: 0,
          remainingPaidAt: null,
          totalPaid: 0
        };
      }

      if (type === 'advance') {
        requestDoc.paymentSummary.advancePaid = true;
        requestDoc.paymentSummary.advancePaidAmount = (requestDoc.paymentSummary.advancePaidAmount || 0) + paymentAmount;
        requestDoc.paymentSummary.advancePaidAt = new Date().toISOString();
        
        // Advance payment confirms the order
        if (['submitted', 'under_review', 'quotation_sent', 'awaiting_confirmation', 'awaiting_advance_payment'].includes(requestDoc.currentStatus)) {
          requestDoc.currentStatus = 'confirmed';
          await StatusHistory.create({
            requestId: cleanRequestId,
            status: 'confirmed',
            note: `Advance payment of ₹${paymentAmount} confirmed (Ref: ${transactionRef || 'N/A'}). Order is now CONFIRMED.`,
            changedBy: 'admin'
          });
        }
      } else if (type === 'remaining' || type === 'full') {
        requestDoc.paymentSummary.remainingPaid = true;
        requestDoc.paymentSummary.remainingPaidAmount = (requestDoc.paymentSummary.remainingPaidAmount || 0) + paymentAmount;
        requestDoc.paymentSummary.remainingPaidAt = new Date().toISOString();

        if (requestDoc.currentStatus === 'awaiting_remaining_payment') {
          requestDoc.currentStatus = 'completed';
          await StatusHistory.create({
            requestId: cleanRequestId,
            status: 'completed',
            note: `Final balance payment of ₹${paymentAmount} received. Order completed and fulfilled.`,
            changedBy: 'admin'
          });
        }
      }

      requestDoc.paymentSummary.totalPaid = (requestDoc.paymentSummary.advancePaidAmount || 0) + (requestDoc.paymentSummary.remainingPaidAmount || 0);
      await requestDoc.save();
    }

    return res.status(201).json({
      success: true,
      message: `Payment of ₹${paymentAmount} successfully recorded.`,
      payment,
      paymentSummary: requestDoc.paymentSummary,
      currentStatus: requestDoc.currentStatus
    });
  } catch (err) {
    console.error('[Record Payment Error]:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// User notifies admin of payment reference
const submitPaymentReference = async (req, res) => {
  try {
    const { requestId, mobileNumber, transactionRef, amount, paymentType = 'advance' } = req.body;

    if (!requestId || !mobileNumber || !transactionRef) {
      return res.status(400).json({
        success: false,
        message: 'Request ID, registered mobile number, and transaction reference are required.'
      });
    }

    const cleanRequestId = requestId.trim().toUpperCase();
    const cleanMobile = mobileNumber.replace(/[^0-9]/g, '').slice(-10);

    const requestDoc = await Request.findOne({ requestId: cleanRequestId });
    if (!requestDoc) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    if (cleanMobile !== requestDoc.user.mobile.replace(/[^0-9]/g, '').slice(-10)) {
      return res.status(403).json({ success: false, message: 'Verification failed.' });
    }

    const payment = await Payment.create({
      requestId: cleanRequestId,
      amount: parseFloat(amount) || (paymentType === 'advance' ? requestDoc.quotation.advanceAmount : requestDoc.quotation.remainingAmount),
      type: paymentType,
      status: 'pending',
      transactionRef: transactionRef.trim(),
      paymentMethod: 'UPI / Direct Transfer',
      notes: 'User submitted transaction reference for verification.',
      recordedBy: 'user',
      recordedAt: new Date().toISOString()
    });

    await StatusHistory.create({
      requestId: cleanRequestId,
      status: requestDoc.currentStatus,
      note: `User submitted ${paymentType} payment reference: ${transactionRef.trim()} (Amount: ₹${payment.amount}). Awaiting Admin verification.`,
      changedBy: 'user'
    });

    return res.status(200).json({
      success: true,
      message: 'Payment reference submitted successfully. Admin will verify and confirm your order shortly.',
      payment
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get payments for a Request
const getPayments = async (req, res) => {
  try {
    const { requestId } = req.params;
    const cleanRequestId = requestId.trim().toUpperCase();
    const payments = await Payment.find({ requestId: cleanRequestId }).sort({ recordedAt: -1 });

    return res.status(200).json({
      success: true,
      payments: Array.isArray(payments) ? payments : []
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  recordPayment,
  submitPaymentReference,
  getPayments
};
