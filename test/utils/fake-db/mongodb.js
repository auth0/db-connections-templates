const defaults = {
  findOne: function (query, callback) {
    return callback(null, query);
  },
  insert: function (data, callback) {
    return callback(null, data);
  },
  update: function (query, data, callback) {
    return callback(null, 1);
  },
  remove: function (query, callback) {
    return callback();
  }
};

module.exports = function (options) {
  options = options || {};

  const users = {
    findOne: options.findOne || defaults.findOne,
    insert: options.insert || defaults.insert,
    update: options.update || defaults.update,
    remove: options.remove || defaults.remove
  };

  const collection = function(collectionName) {
    if (collectionName !== 'users') {
      throw new Error('mongodb collectionName mismatch!');
    }

    return users;
  };

  return function (connectionString, callback) {
    if (connectionString !== 'mongodb://user:pass@mymongoserver.com/my-db') {
      throw new Error('mongodb connectionString mismatch!');
    }

    return callback({ collection: collection });
  };
};
