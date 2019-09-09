function changePassword (email, newPassword, callback) {
  //this example uses the "pg" library
  //more info here: https://github.com/brianc/node-postgres

  const bcrypt = require('bcrypt');
  const postgres = require('pg');

  const conString = 'postgres://user:pass@localhost/mydb';
  postgres.connect(conString, function (err, client, done) {
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
