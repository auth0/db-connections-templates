function getByEmail(email, callback) {
  const mysql = require('mysql');

  const connection = mysql({
    host: 'localhost',
    user: 'me',
    password: 'secret',
    database: 'mydb'
  });

  connection.connect();

  const query = 'SELECT * FROM users WHERE email = ?';

  connection.query(query, [ email ], function(err, results) {
    return callback(err, results && results[0]);
  });
}
