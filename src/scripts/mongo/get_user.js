function getByEmail(email, callback) {
  const mongo = require('mongodb');

  mongo('mongodb://user:pass@mymongoserver.com/my-db', function (db) {
    const users = db.collection('users');

    users.findOne({ email: email }, function (err, user) {
      if (err) return callback(err);

      return callback(null, {
        user_id: user._id.toString(),
        nickname: user.nickname,
        email: user.email
      });
    });
  });
}
