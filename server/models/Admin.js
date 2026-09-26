const { getCollection } = require('../config/store');

const AdminCollection = getCollection('admins');

class AdminModel {
  static async findOne(query) {
    return AdminCollection.findOne(query);
  }

  static async findById(id) {
    return AdminCollection.findById(id);
  }

  static async countDocuments(query) {
    return AdminCollection.countDocuments(query);
  }

  static async deleteMany(query) {
    return AdminCollection.deleteMany(query);
  }

  static async create(data) {
    return AdminCollection.create(data);
  }

  constructor(data) {
    // Return a Document directly
    const Document = AdminCollection._read ? require('../config/store').getCollection('admins').findOne : null;
    return AdminCollection.create(data);
  }
}

module.exports = AdminModel;
