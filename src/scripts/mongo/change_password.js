function changePassword(email, newPassword, callback) {
  const mongo = require('mongodb');
  const bcrypt = require('bcrypt');

  mongo('mongodb://user:pass@mymongoserver.com/my-db', function (db) {
    const users = db.collection('users');

    bcrypt.hash(newPassword, 10, function (err, hash) {
      if (err) return callback(err);
      users.update({ email: email }, { $set: { password: hash } }, function (err, count) {
        if (err) return callback(err);
        callback(null, count > 0);
      });
    });
  });
}
