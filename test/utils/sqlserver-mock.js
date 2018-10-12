module.exports = function(request, params, row) {
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
    this.addParameter = params;

    this.run = function() {
      request(query, requestCallback);
    };

    this.on = function(event, rowCallback) {
      if (event === 'row') row(rowCallback);
    };

    return this;
  };

  return {
    Connection: Connection,
    Request: Request,
    TYPES: {
      VarChar: 'varchar'
    }
  };
};
