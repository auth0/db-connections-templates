function changePassword(email, newPassword, callback) {
  const bcrypt = require('bcrypt');
  const MongoClient = require('mongodb@3.1.4').MongoClient;
  const client = new MongoClient('mongodb://user:pass@localhost');

  client.connect(function (err) {
    if (err) return callback(err);

    const db = client.db('db-name');
    const users = db.collection('users');

    bcrypt.hash(newPassword, 10, function (err, hash) {
      if (err) {
        client.close();
        return callback(err);
      }

      users.update({ email: email }, { $set: { password: hash } }, function (err, writeResult) {
        client.close();
        if (err) return callback(err);
        callback(null, writeResult.result.nModified > 0);
      });
    });
  });
}
