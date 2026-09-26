const { getCollection } = require('../config/store');

const PaymentCollection = getCollection('payments');

class PaymentModel {
  static find(query) {
    return PaymentCollection.find(query);
  }

  static async findOne(query) {
    return PaymentCollection.findOne(query);
  }

  static async create(data) {
    return PaymentCollection.create(data);
  }

  constructor(data) {
    return PaymentCollection.create(data);
  }
}

module.exports = PaymentModel;
