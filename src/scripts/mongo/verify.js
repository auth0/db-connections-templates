function verify (email, callback) {
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
