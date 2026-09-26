const { getCollection } = require('../config/store');

const RequestCollection = getCollection('requests');

const STATUS_ENUM = [
  'submitted',
  'under_review',
  'quotation_sent',
  'awaiting_confirmation',
  'awaiting_advance_payment',
  'confirmed',
  'work_in_progress',
  'review_or_revision',
  'ready_for_final_delivery',
  'awaiting_remaining_payment',
  'completed',
  'cancelled'
];

class RequestModel {
  static find(query) {
    return RequestCollection.find(query);
  }

  static async findOne(query) {
    return RequestCollection.findOne(query);
  }

  static async findById(id) {
    return RequestCollection.findById(id);
  }

  static async countDocuments(query) {
    return RequestCollection.countDocuments(query);
  }

  static async create(data) {
    return RequestCollection.create(data);
  }

  constructor(data) {
    this._data = {
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
      },
      ...data
    };
    return RequestCollection.create(this._data);
  }
}

module.exports = {
  Request: RequestModel,
  STATUS_ENUM
};
