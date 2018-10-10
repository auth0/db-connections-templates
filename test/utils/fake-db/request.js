const defaults = {
  post: function (data, callback) {
    return callback();
  },
  get: function (query, callback) {
    return callback(null, query);
  },
  put: function (query, data, callback) {
    return callback();
  },
  del: function (query, callback) {
    return callback();
  }
};

module.exports = function (options) {
  options = options || {};

  return {
    post: options.post || defaults.post,
    get: options.get || defaults.get,
    put: options.put || defaults.put,
    del: options.del || defaults.del
  };
};
