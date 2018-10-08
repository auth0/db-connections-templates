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

  const Request = function(query, callback) {
    this.query = query;
    this.addParameter = function(key, type, value) {
      this.query = this.query.replace('@' + key, value);
    };

    this.run = function() {
      if (options.callback) {
        return options.callback(this.query, callback);
      }

      return callback();
    };

    return this;
  };

  return {
    Connection: Connection,
    Request: Request,
    TYPES: {
      VarChar: ''
    }
  };
};
