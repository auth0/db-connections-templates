const defaultQuery = function(query, params, callback) {
  return callback();
};

module.exports = function(options) {
  options = options || {};

  const connection = {
    query: options.query || defaultQuery,
    connect: function() {
      return null;
    }
  };

  return function(settings) {
    if (options.init) {
      options.init(settings);
    }

    return connection;
  };
};
