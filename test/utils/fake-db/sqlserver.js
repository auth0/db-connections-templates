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
        return options.callback(this.query, requestCallback);
      }

      return requestCallback();
    };

    self.on = function(event, rowCallback) {
      if (event === 'row' && options.row) {
        options.row(rowCallback);
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
