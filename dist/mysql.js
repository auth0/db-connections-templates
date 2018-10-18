module.exports = {
 change_password: function changePassword(email, newPassword, callback) {
  const mysql = require('mysql');
  const bcrypt = require('bcrypt');

  const connection = mysql({
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
,
 create: function create(user, callback) {
  const mysql = require('mysql');
  const bcrypt = require('bcrypt');

  const connection = mysql({
    host: 'localhost',
    user: 'me',
    password: 'secret',
    database: 'mydb'
  });

  connection.connect();

  const query = 'INSERT INTO users SET ?';

  bcrypt.hash(user.password, 10, function(err, hash) {
    if (err) return callback(err);

    const insert = {
      password: hash,
      email: user.email
    };

    connection.query(query, insert, function(err, results) {
      if (err) return callback(err);
      if (results.length === 0) return callback();
      callback(null);
    });
  });
}
,
 delete: function remove(id, callback) {
  const mysql = require('mysql');

  const connection = mysql({
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
,
 get_user: function getByEmail(email, callback) {
  const mysql = require('mysql');

  const connection = mysql({
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
,
 login: function login(email, password, callback) {
  const mysql = require('mysql');
  const bcrypt = require('bcrypt');

  const connection = mysql({
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
,
 verify: function verify(email, callback) {
  const mysql = require('mysql');

  const connection = mysql({
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
,
};
