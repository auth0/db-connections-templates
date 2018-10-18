module.exports = {
 change_password: function changePassword(email, newPassword, callback) {
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
,
 create: function create (user, callback) {
  const mongo = require('mongodb');
  const bcrypt = require('bcrypt');

  mongo('mongodb://user:pass@mymongoserver.com/my-db', function (db) {
    const users = db.collection('users');

    users.findOne({ email: user.email }, function (err, withSameMail) {
      if (err) return callback(err);
      if (withSameMail) return callback(new Error('the user already exists'));

      bcrypt.hash(user.password, 10, function (err, hash) {
        if (err) return callback(err);
        user.password = hash;
        users.insert(user, function (err, inserted) {
          if (err) return callback(err);
          callback(null);
        });
      });
    });
  });
}
,
 delete: function remove (id, callback) {
  const mongo = require('mongodb');

  mongo('mongodb://user:pass@mymongoserver.com/my-db', function (db) {
    const users = db.collection('users');

    users.remove({ _id: id }, function (err) {
      if (err) return callback(err);
      callback(null);
    });
  });

}
,
 get_user: function getByEmail (email, callback) {
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
,
 login: function login(email, password, callback) {
  const mongo = require('mongodb');
  const bcrypt = require('bcrypt');

  mongo('mongodb://user:pass@mymongoserver.com/my-db', function (db) {
    const users = db.collection('users');

    users.findOne({ email: email }, function (err, user) {
      if (err) return callback(err);
      if (!user) return callback(new WrongUsernameOrPasswordError(email));

      bcrypt.compare(password, user.password, function (err, isValid) {
        if (err || !isValid) return callback(err || new WrongUsernameOrPasswordError(email));

        return callback(null, {
            user_id: user._id.toString(),
            nickname: user.nickname,
            email: user.email
          });
      });
    });
  });
}
,
 verify: function verify (email, callback) {
  const mongo = require('mongodb');

  mongo('mongodb://user:pass@mymongoserver.com/my-db', function (db) {
    const users = db.collection('users');
    const query = { email: email, email_verified: false };

    users.update(query, { $set: { email_verified: true } }, function (err, count) {
      if (err) return callback(err);
      callback(null, count > 0);
    });
  });
}
,
};
