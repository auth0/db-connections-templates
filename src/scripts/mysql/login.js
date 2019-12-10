function login(email, password, callback) {
  const mysql = require('mysql');
  const bcrypt = require('bcrypt');

  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'me',
    password: 'secret',
    database: 'mydb'
  });

  connection.connect();

  const query = 'SELECT id, nickname, email, password FROM users WHERE email = ?';

  connection.query(query, [ email ], function(err, results) {
    if (err) return callback(err);
    if (results.length === 0) return callback(new WrongUsernameOrPasswordError(email));
    const user = results[0];

    bcrypt.compare(password, user.password, function(err, isValid) {
      if (err || !isValid) return callback(err || new WrongUsernameOrPasswordError(email));

      callback(null, {
        user_id: user.id.toString(),
        nickname: user.nickname,
        email: user.email
      });
    });
  });
}
