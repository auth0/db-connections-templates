function changePassword(email, newPassword, callback) {
  const request = require('request');

  request.put({
    url: 'https://localhost/users',
    json: { email: email, password: newPassword }
    //for more options check:
    //https://github.com/mikeal/request#requestoptions-callback
  }, function(err, response, body) {
    if (err) return callback(err);
    if (response.statusCode === 401) return callback();
    callback(null, body);
  });
}
