function getByEmail(email, callback) {
  const mysql = require('mysql');

  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'me',
    password: 'secret',
    database: 'mydb'
  });

  connection.connect();

  const query = 'SELECT id, nickname, email FROM users WHERE email = ?';

  connection.query(query, [ email ], function(err, results) {
    if (err || results.length === 0) return callback(err || null);

    const user = results[0];
    callback(null, {
      user_id: user.id.toString(),
      nickname: user.nickname,
      email: user.email
    });
  });
}
