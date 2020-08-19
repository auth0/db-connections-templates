function login(email, password, callback) {
  const request = require('request');

  request.get({
    url: 'https://localhost/profile',
    auth: {
      username: email,
      password: password
    }
    //for more options check:
    //https://github.com/mikeal/request#requestoptions-callback
  }, function(err, response, body) {
    if (err) return callback(err);
    if (response.statusCode === 401) return callback();
    const user = JSON.parse(body);

    callback(null, {
      user_id: user.user_id.toString(),
      nickname: user.nickname,
      email: user.email
    });
  });
}
