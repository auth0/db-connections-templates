module.exports = function(options) {
  options = options || {};

  const Connection = function() {
    const self = this;

    self.on = function(event, callback) {
      if (event === 'connect') {
        callback();
      }

      return self;
    };

    self.execSql = function(request) {
      request.run();
    };

    return self;
  };

  const Request = function(query, requestCallback) {
    const self = this;
    self.query = query;
    self.addParameter = function(key, type, value) {
      self.query = self.query.replace(new RegExp('@' + key, 'g'), value);
    };

    self.run = function() {
      if (options.callback) {
        options.callback(this.query, requestCallback);
      } else {
        requestCallback();
      }

      if (self.rowCallback && options.row) {
        setTimeout(function() {
          options.row(self.rowCallback);
        }, 100);
      }
    };

    self.on = function(event, rowCallback) {
      if (event === 'row') {
        self.rowCallback = rowCallback;
      }
    };

    return self;
  };

  return {
    Connection: Connection,
    Request: Request,
    TYPES: {
      VarChar: ''
    }
  };
};
