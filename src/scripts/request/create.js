function create(user, callback) {
  const request = require('request');

  request.post({
    url: 'https://myserviceurl.com/users',
    json: user
    //for more options check:
    //https://github.com/mikeal/request#requestoptions-callback
  }, function(err, response, body) {
    if (err) return callback(err);

    callback(null);
  });
}
