function verify (email, callback) {
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
