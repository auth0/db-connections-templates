function getByEmail(email, callback) {
  //more info here: https://tediousjs.github.io/tedious/index.html
  const sqlserver = require('tedious@1.11.0');

  const Connection = sqlserver.Connection;
  const Request = sqlserver.Request;
  const TYPES = sqlserver.TYPES;
  var user_profile = [];

  const connection = new Connection({
    userName: '',
    password: '',
    server: '',
    options: {
      database: '',
      port: 1433
    }
  });

  const query = 'SELECT Id, Nickname, Email FROM dbo.Users WHERE Email = @Email';

  connection.on('debug', function (text) {
    console.log(text);
  }).on('errorMessage', function (text) {
    console.log(JSON.stringify(text, null, 2));
  }).on('infoMessage', function (text) {
    console.log(JSON.stringify(text, null, 2));
  });

  connection.on('connect', function (err) {
    if (err) return callback(err);

    const request = new Request(query, function (err, rowCount) {
      if (err) return callback(err);
     

      if (rowCount === 0) {
        return callback("The User does not exist in DB");
      }
    });

    // Found a record for the user in DB
    request.on('row', function (columns) {
      columns.forEach(function (column) {
        user_profile.push(column.value);
      });

      // Return the user profile
      callback(null, {
        user_id: user_profile[0],
        nickname: user_profile[1],
        email: user_profile[2]
      });
    });

    request.addParameter('Email', TYPES.VarChar, email);
    connection.execSql(request);
  });
}
