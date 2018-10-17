function loginByEmail(email, callback) {
  const oracledb = require('oracledb');
  oracledb.outFormat = oracledb.OBJECT;

  oracledb.getConnection({
      user: configuration.dbUser,
      password: configuration.dbUserPassword,
      connectString: 'CONNECTION_STRING' // Refer here https://github.com/oracle/node-oracledb/blob/master/doc/api.md#connectionstrings
    },
    function(err, connection) {
      if (err) return callback(err);

      const query = 'select ID, EMAIL, NICKNAME from Users where EMAIL = :email';
      connection.execute(query, [email], function(err, result) {
        doRelease(connection);

        if (err || result.rows.length === 0) return callback(err);

        const userProfile = {
          user_id: result.rows[0].ID,
          nickname: result.rows[0].NICKNAME,
          email: result.rows[0].EMAIL
        };
        callback(null, userProfile);
      });
    });

  // Note: connections should always be released when not needed
  function doRelease(connection) {
    connection.close(
      function(err) {
        if (err) console.error(err.message);
      });
  }
}
