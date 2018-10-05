function getByEmail (email, callback) {
  const mongo = require('mongodb');

  mongo('mongodb://user:pass@mymongoserver.com/my-db', function (db) {
    const users = db.collection('users');

    users.findOne({ email: email }, callback);
  });
}
