const { getCollection } = require('../config/store');

const StatusHistoryCollection = getCollection('status_histories');

class StatusHistoryModel {
  static find(query) {
    return StatusHistoryCollection.find(query);
  }

  static async findOne(query) {
    return StatusHistoryCollection.findOne(query);
  }

  static async create(data) {
    return StatusHistoryCollection.create(data);
  }

  constructor(data) {
    return StatusHistoryCollection.create(data);
  }
}

module.exports = StatusHistoryModel;
