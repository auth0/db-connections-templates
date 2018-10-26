function remove(id, callback) {
  const mongo = require('mongodb');

  mongo('mongodb://user:pass@mymongoserver.com/my-db', function (db) {
    const users = db.collection('users');

    users.remove({ _id: id }, function (err) {
      if (err) return callback(err);
      callback(null);
    });
  });

}
