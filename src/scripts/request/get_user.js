function loginByEmail(email, callback) {
  const request = require('request');

  request.get({
    url: 'https://localhost/users-by-email/' + email
    //for more options check:
    //https://github.com/mikeal/request#requestoptions-callback
  }, function(err, response, body) {
    if (err) return callback(err);

    const user = JSON.parse(body);

    callback(null, {
      user_id: user.user_id.toString(),
      nickname: user.nickname,
      email: user.email
    });
  });
}
