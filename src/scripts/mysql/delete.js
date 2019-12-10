function remove(id, callback) {
  const mysql = require('mysql');

  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'me',
    password: 'secret',
    database: 'mydb'
  });

  connection.connect();

  const query = 'DELETE FROM users WHERE id = ?';

  connection.query(query, [ id ], function(err) {
    if (err) return callback(err);
    callback(null);
  });
}
