function remove(id, callback) {
  const request = require('request');

  request.del({
    url: 'https://myserviceurl.com/users/' + id
    // for more options check:
    // https://github.com/mikeal/request#requestoptions-callback
  }, function(err, response, body) {
    if (err) return callback(err);

    callback(null);
  });
}
