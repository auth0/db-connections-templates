module.exports = {
 change_password: function changePassword(email, newPassword, callback) {
  const request = require('request');

  request.put({
    url: 'https://myserviceurl.com/users',
    json: { email: email, password: newPassword }
    //for more options check:
    //https://github.com/mikeal/request#requestoptions-callback
  }, function(err, response, body) {
    if (err) return callback(err);
    if (response.statusCode === 401) return callback();
    callback(null, body);
  });
}
,
 create: function create(user, callback) {
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
,
 delete: function remove(id, callback) {
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
,
 get_user: function loginByEmail(email, callback) {
  const request = require('request');

  request.get({
    url: 'https://myserviceurl.com/users-by-email/' + email
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
,
 login: function login(email, password, callback) {
  const request = require('request');

  request.get({
    url: 'https://myserviceurl.com/profile',
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
,
 verify: function verify(email, callback) {
  const request = require('request');

  request.put({
    url: 'https://myserviceurl.com/users',
    json: { email: email }
    //for more options check:
    //https://github.com/mikeal/request#requestoptions-callback
  }, function(err, response, body) {
    if (err) return callback(err);
    if (response.statusCode === 401) return callback();

    callback(null, body);
  });
}
,
};
