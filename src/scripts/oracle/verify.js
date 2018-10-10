function verify(email, callback) {
  const oracledb = require('oracledb');
  oracledb.outFormat = oracledb.OBJECT;

  oracledb.getConnection({
      user: configuration.dbUser,
      password: configuration.dbUserPassword,
      connectString: 'CONNECTION_STRING' // Refer here https://github.com/oracle/node-oracledb/blob/master/doc/api.md#connectionstrings
    },
    function(err, connection) {
      if (err) return callback(err);

      const query = 'update Users set EMAIL_VERIFIED = \'true\' where EMAIL = :email';
      connection.execute(query, [email], { autoCommit: true }, function(err, result) {
        doRelease(connection);
        callback(err, result && result.rowsAffected > 0);
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
