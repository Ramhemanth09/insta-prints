const { getCollection } = require('../config/store');

const FileCollection = getCollection('files');

class FileModel {
  static find(query) {
    return FileCollection.find(query);
  }

  static async findOne(query) {
    return FileCollection.findOne(query);
  }

  static async findById(id) {
    return FileCollection.findById(id);
  }

  static async insertMany(docs) {
    return FileCollection.insertMany(docs);
  }

  static async create(data) {
    return FileCollection.create(data);
  }

  constructor(data) {
    return FileCollection.create(data);
  }
}

module.exports = FileModel;
