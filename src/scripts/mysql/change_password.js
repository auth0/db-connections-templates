function changePassword(email, newPassword, callback) {
  const mysql = require('mysql');
  const bcrypt = require('bcrypt');

  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'me',
    password: 'secret',
    database: 'mydb'
  });

  connection.connect();

  const query = 'UPDATE users SET password = ? WHERE email = ?';

  bcrypt.hash(newPassword, 10, function(err, hash) {
    if (err) return callback(err);

    connection.query(query, [ hash, email ], function(err, results) {
      if (err) return callback(err);
      callback(null, results.length > 0);
    });
  });
}
