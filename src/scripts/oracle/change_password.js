function changePassword(email, newPassword, callback) {
  const bcrypt = require('bcrypt');
  const oracledb = require('oracledb');
  oracledb.outFormat = oracledb.OBJECT;

  oracledb.getConnection({
      user: configuration.dbUser,
      password: configuration.dbUserPassword,
      connectString: 'CONNECTION_STRING' // Refer here https://github.com/oracle/node-oracledb/blob/master/doc/api.md#connectionstrings
    },
    function(err, connection) {
      if (err) callback(err);

      bcrypt.hash(newPassword, 10, function(err, hash) {
        if (err) return callback(err);

        const query = 'update Users set PASSWORD = :hash where EMAIL = :email';
        connection.execute(query, [hash, email], { autoCommit: true }, function(err, result) {
          doRelease(connection);
          callback(err, result && result.rowsAffected > 0);
        });
      });

      // Note: connections should always be released when not needed
      function doRelease(connection) {
        connection.close(
          function(err) {
            if (err) console.error(err.message);
          });
      }
    });
}
