module.exports = {
 change_password: function changePassword (email, newPassword, callback) {
  //this example uses the "pg" library
  //more info here: https://github.com/brianc/node-postgres

  const bcrypt = require('bcrypt');
  const postgres = require('pg');

  const conString = 'postgres://user:pass@localhost/mydb';
  postgres(conString, function (err, client, done) {
    if (err) return callback(err);

    bcrypt.hash(newPassword, 10, function (err, hash) {
      if (err) return callback(err);

      const query = 'UPDATE users SET password = $1 WHERE email = $2';
      client.query(query, [hash, email], function (err, result) {
        // NOTE: always call `done()` here to close
        // the connection to the database
        done();

        return callback(err, result && result.rowCount > 0);
      });
    });
  });
}
,
 create: function create(user, callback) {
  //this example uses the "pg" library
  //more info here: https://github.com/brianc/node-postgres

  const bcrypt = require('bcrypt');
  const postgres = require('pg');

  const conString = 'postgres://user:pass@localhost/mydb';
  postgres(conString, function (err, client, done) {
    if (err) return callback(err);

    bcrypt.hash(user.password, 10, function (err, hashedPassword) {
      if (err) return callback(err);

      const query = 'INSERT INTO users(email, password) VALUES ($1, $2)';
      client.query(query, [user.email, hashedPassword], function (err, result) {
        // NOTE: always call `done()` here to close
        // the connection to the database
        done();

        return callback(err);
      });
    });
  });
}
,
 delete: function remove (id, callback) {
  //this example uses the "pg" library
  //more info here: https://github.com/brianc/node-postgres

  const postgres = require('pg');

  const conString = 'postgres://user:pass@localhost/mydb';
  postgres(conString, function (err, client, done) {
    if (err) return callback(err);

    const query = 'DELETE FROM users WHERE id = $1';
    client.query(query, [id], function (err) {
      // NOTE: always call `done()` here to close
      // the connection to the database
      done();

      return callback(err);
    });
  });

}
,
 get_user: function loginByEmail(email, callback) {
  //this example uses the "pg" library
  //more info here: https://github.com/brianc/node-postgres

  const postgres = require('pg');

  const conString = 'postgres://user:pass@localhost/mydb';
  postgres(conString, function (err, client, done) {
    if (err) return callback(err);

    const query = 'SELECT id, nickname, email FROM users WHERE email = $1';
    client.query(query, [email], function (err, result) {
      // NOTE: always call `done()` here to close
      // the connection to the database
      done();

      if (err || result.rows.length === 0) return callback(err);

      const user = result.rows[0];

      return callback(null, {
        user_id: user.id,
        nickname: user.nickname,
        email: user.email
      });
    });
  });
}
,
 login: function login(email, password, callback) {
  //this example uses the "pg" library
  //more info here: https://github.com/brianc/node-postgres

  const bcrypt = require('bcrypt');
  const postgres = require('pg');

  const conString = 'postgres://user:pass@localhost/mydb';
  postgres(conString, function (err, client, done) {
    if (err) return callback(err);

    const query = 'SELECT id, nickname, email, password FROM users WHERE email = $1';
    client.query(query, [email], function (err, result) {
      // NOTE: always call `done()` here to close
      // the connection to the database
      done();

      if (err || result.rows.length === 0) return callback(err || new WrongUsernameOrPasswordError(email));

      const user = result.rows[0];

      bcrypt.compare(password, user.password, function (err, isValid) {
        if (err || !isValid) return callback(err || new WrongUsernameOrPasswordError(email));

        return callback(null, {
          user_id: user.id,
          nickname: user.nickname,
          email: user.email
        });
      });
    });
  });
}
,
 verify: function verify (email, callback) {
  //this example uses the "pg" library
  //more info here: https://github.com/brianc/node-postgres

  const postgres = require('pg');

  const conString = 'postgres://user:pass@localhost/mydb';
  postgres(conString, function (err, client, done) {
    if (err) return callback(err);

    const query = 'UPDATE users SET email_Verified = true WHERE email_Verified = false AND email = $1';
    client.query(query, [email], function (err, result) {
      // NOTE: always call `done()` here to close
      // the connection to the database
      done();

      return callback(err, result && result.rowCount > 0);
    });
  });
}
,
};
