const { getCollection } = require('../config/store');

const MessageCollection = getCollection('messages');

class MessageModel {
  static find(query) {
    return MessageCollection.find(query);
  }

  static async findOne(query) {
    return MessageCollection.findOne(query);
  }

  static async create(data) {
    return MessageCollection.create(data);
  }

  constructor(data) {
    return MessageCollection.create(data);
  }
}

module.exports = MessageModel;
