function remove(id, callback) {
  const MongoClient = require('mongodb@3.1.4').MongoClient;
  const client = new MongoClient('mongodb://user:pass@mymongoserver.com');

  client.connect(function (err) {
    if (err) return callback(err);

    const db = client.db('db-name');
    const users = db.collection('users');

    users.remove({ _id: id }, function (err) {
      client.close();

      if (err) return callback(err);
      callback(null);
    });
  });

}
