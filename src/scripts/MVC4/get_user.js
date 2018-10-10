function getByEmail (email, callback) {
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
      encrypt: true // for Windows Azure
    }
  });

  connection.on('debug', function(text) {
    // if you have connection issues, uncomment this to get more detailed info
    //console.log(text);
  }).on('errorMessage', function(text) {
    // this will show any errors when connecting to the SQL database or with the SQL statements
    console.log(JSON.stringify(text));
  });

  connection.on('connect', function(err) {
    if (err) return callback(err);

    var user = {};
    const query =
      'SELECT webpages_Membership.UserId, UserName, UserProfile.UserName from webpages_Membership ' +
      'INNER JOIN UserProfile ON UserProfile.UserId = webpages_Membership.UserId ' +
      'WHERE UserProfile.UserName = @Username';

    const getMembershipQuery = new Request(query, function (err, rowCount) {
      if (err) return callback(err);
      if (rowCount < 1) return callback();

      callback(null, user);
    });

    getMembershipQuery.addParameter('Username', TYPES.VarChar, email);

    getMembershipQuery.on('row', function (fields) {
      user = {
        user_id: fields.UserId.value,
        nickname: fields.UserName.value,
        email: fields.Email.value
      };
    });

    connection.execSql(getMembershipQuery);
  });
}
