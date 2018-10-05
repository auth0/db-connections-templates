function login(email, password, callback) {
  const mongo = require('mongodb');
  const bcrypt = require('bcrypt');

  mongo('mongodb://user:pass@mymongoserver.com/my-db', function (db) {
    const users = db.collection('users');

    users.findOne({ email: email }, function (err, user) {
      if (err) return callback(err);
      if (!user) return callback(new WrongUsernameOrPasswordError(email));

      bcrypt.compare(password, user.password, function (err, isValid) {
        if (err) {
          callback(err);
        } else if (!isValid) {
          callback(new WrongUsernameOrPasswordError(email));
        } else {
          callback(null, {
            user_id: user._id.toString(),
            nickname: user.nickname,
            email: user.email
          });
        }
      });
    });
  });
}
