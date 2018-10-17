function remove(id, callback) {
  const sqlserver = require('tedious@1.11.0');

  const Connection = sqlserver.Connection;
  const Request = sqlserver.Request;
  const TYPES = sqlserver.TYPES;

  const connection = new Connection({
    userName: 'the username',
    password: 'the password',
    server: 'the server',
    options: {
      database: 'the db name',
      encrypt: true,
      // Required to retrieve userId needed for Membership entity creation
      rowCollectionOnRequestCompletion: true
    }
  });

  connection.on('debug', function (text) {
    // if you have connection issues, uncomment this to get more detailed info
    // console.log(text);
  }).on('errorMessage', function (text) {
    // this will show any errors when connecting to the SQL database or with the SQL statements
    console.log(JSON.stringify(text));
  });

  connection.on('connect', function (err) {
    if (err) return callback(err);
    executeDelete(['webpages_Membership', 'UserProfile'], function (err) {
      if (err) return callback(err);
      callback(null);
    });
  });

  function executeDelete(tables, callback) {
    const query = tables.map(function (table) {
      return 'DELETE FROM ' + table + ' WHERE UserId = @UserId';
    }).join(';');
    const request = new Request(query, function (err) {
      if (err) return callback(err);
      callback(null);
    });
    request.addParameter('UserId', TYPES.VarChar, id);
    connection.execSql(request);
  }
}
