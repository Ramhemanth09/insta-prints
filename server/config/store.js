const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

class Collection {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(dataDir, `${name}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([]));
    }
  }

  _read() {
    try {
      const content = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(content || '[]');
    } catch (e) {
      return [];
    }
  }

  _write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  find(query = {}) {
    let items = this._read();
    items = items.filter(item => this._matches(item, query));
    return new QueryCursor(items);
  }

  async findOne(query = {}) {
    const items = this._read();
    const found = items.find(item => this._matches(item, query));
    return found ? new Document(found, this) : null;
  }

  async findById(id) {
    return this.findOne({ _id: id });
  }

  async create(docData) {
    const doc = new Document(docData, this);
    await doc.save();
    return doc;
  }

  async insertMany(docsArray) {
    const items = this._read();
    const newDocs = docsArray.map(d => {
      const raw = {
        _id: d._id || crypto.randomBytes(12).toString('hex'),
        createdAt: d.createdAt || new Date().toISOString(),
        updatedAt: d.updatedAt || new Date().toISOString(),
        ...d
      };
      return raw;
    });
    items.push(...newDocs);
    this._write(items);
    return newDocs.map(d => new Document(d, this));
  }

  async countDocuments(query = {}) {
    const items = this._read();
    if (!query || Object.keys(query).length === 0) return items.length;
    return items.filter(item => this._matches(item, query)).length;
  }

  async deleteMany(query = {}) {
    let items = this._read();
    if (!query || Object.keys(query).length === 0) {
      this._write([]);
      return { deletedCount: items.length };
    }
    const filtered = items.filter(item => !this._matches(item, query));
    this._write(filtered);
    return { deletedCount: items.length - filtered.length };
  }

  _matches(item, query) {
    if (!query || Object.keys(query).length === 0) return true;

    for (const key of Object.keys(query)) {
      if (key === '$or') {
        const orConditions = query['$or'];
        const matchedOr = orConditions.some(cond => this._matches(item, cond));
        if (!matchedOr) return false;
        continue;
      }

      const val = query[key];
      const itemVal = this._getNested(item, key);

      if (val instanceof RegExp) {
        if (!val.test(String(itemVal || ''))) return false;
      } else if (val && typeof val === 'object' && val.$in) {
        if (!val.$in.includes(itemVal)) return false;
      } else {
        if (itemVal != val) return false;
      }
    }
    return true;
  }

  _getNested(obj, keyPath) {
    if (!obj) return undefined;
    const parts = keyPath.split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur === null || cur === undefined) return undefined;
      cur = cur[p];
    }
    return cur;
  }
}

class QueryCursor {
  constructor(items) {
    this._items = items;
  }

  sort(sortOptions = {}) {
    if (!sortOptions || typeof sortOptions !== 'object') return this;
    const key = Object.keys(sortOptions)[0];
    if (!key) return this;
    const order = sortOptions[key] === 1 || sortOptions[key] === 'asc' ? 1 : -1;

    this._items.sort((a, b) => {
      const aVal = a[key] !== undefined && a[key] !== null ? a[key] : '';
      const bVal = b[key] !== undefined && b[key] !== null ? b[key] : '';
      if (aVal < bVal) return -1 * order;
      if (aVal > bVal) return 1 * order;
      return 0;
    });
    return this;
  }

  limit(num) {
    if (typeof num === 'number') {
      this._items = this._items.slice(0, num);
    }
    return this;
  }

  select(fields) {
    return this;
  }

  then(resolve, reject) {
    resolve(this._items);
  }

  catch(reject) {
    // No error for in-memory
  }
}

class Document {
  constructor(data, collection) {
    Object.defineProperty(this, '_collection', {
      value: collection,
      enumerable: false,
      writable: true
    });

    const cleanData = { ...data };
    delete cleanData._collection;

    this._id = cleanData._id || crypto.randomBytes(12).toString('hex');
    this.createdAt = cleanData.createdAt || new Date().toISOString();
    this.updatedAt = cleanData.updatedAt || new Date().toISOString();
    
    Object.assign(this, cleanData);
  }

  async save() {
    this.updatedAt = new Date().toISOString();
    const plainObj = { ...this };
    delete plainObj._collection;

    const items = this._collection._read();
    const idx = items.findIndex(i => i._id === this._id);
    if (idx >= 0) {
      items[idx] = plainObj;
    } else {
      items.push(plainObj);
    }
    this._collection._write(items);
    return this;
  }
}

const collections = {};
const getCollection = (name) => {
  if (!collections[name]) {
    collections[name] = new Collection(name);
  }
  return collections[name];
};

module.exports = {
  getCollection
};
