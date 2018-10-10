module.exports = function (options) {
  options = options || {};

  const execute = function(query, params, callback) {
    if (options.query) {
      return options.query(query, params, callback);
    }

    return callback();
  };

  return function (connectionString, callback) {
    if (connectionString !== 'postgres://user:pass@localhost/mydb') {
      throw new Error('postgres connectionString mismatch!');
    }

    return callback(null, { query: execute }, function() {});
  };
};
