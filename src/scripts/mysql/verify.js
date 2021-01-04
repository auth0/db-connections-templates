function verify(email, callback) {
  const mysql = require('mysql');

  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'me',
    password: 'secret',
    database: 'mydb'
  });

  connection.connect();

  const query = 'UPDATE users SET email_Verified = true WHERE email_Verified = false AND email = ?';

  connection.query(query, [ email ], function(err, results) {
    if (err) return callback(err);

    callback(null, results.length > 0);
  });

}
