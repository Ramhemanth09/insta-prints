const { getCollection } = require('../config/store');

const FailedLoginCollection = getCollection('failed_logins');

class FailedLoginLogModel {
  static find(query) {
    return FailedLoginCollection.find(query);
  }

  static async create(data) {
    return FailedLoginCollection.create(data);
  }

  constructor(data) {
    return FailedLoginCollection.create(data);
  }
}

module.exports = FailedLoginLogModel;
