function remove(id, callback) {
  const oracledb = require('oracledb');
  oracledb.outFormat = oracledb.OBJECT;

  oracledb.getConnection({
      user: configuration.dbUser,
      password: configuration.dbUserPassword,
      connectString: 'CONNECTION_STRING' // Refer here https://github.com/oracle/node-oracledb/blob/master/doc/api.md#connectionstrings
    },
    function(err, connection) {
      if (err) return callback(err);

      const query = 'delete Users where ID = :id';
      connection.execute(query, [id], { autoCommit: true }, function(err) {
        doRelease(connection);
        callback(err);
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
