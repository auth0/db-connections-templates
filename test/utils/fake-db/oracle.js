module.exports = function(options) {
  options = options || {};

  const connection = {
    execute: function(query, params, settings, callback) {
      if (typeof settings === 'function') {
        callback = settings;
        settings = null;
      }

      if (options.execute) {
        options.execute(query, params, callback);
      }
    },
    close: function(cb) {
      if (options.close) {
        return options.close(cb);
      }

      cb();
    }
  };

  return {
    outFormat: '',
    OBJECT: '',
    getConnection: function (params, callback) {
      return callback(null, connection);
    }
  };
};
