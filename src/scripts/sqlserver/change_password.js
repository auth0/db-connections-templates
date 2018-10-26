function changePassword (email, newPassword, callback) {
  //this example uses the "tedious" library
  //more info here: http://tediousjs.github.io/tedious/
  const bcrypt = require('bcrypt');
  const sqlserver = require('tedious@1.11.0');

  const Connection = sqlserver.Connection;
  const Request = sqlserver.Request;
  const TYPES = sqlserver.TYPES;

  const connection = new Connection({
    userName:  'test',
    password:  'test',
    server:    'localhost',
    options:  {
      database: 'mydb'
    }
  });

  const query = 'UPDATE dbo.Users SET Password = @NewPassword WHERE Email = @Email';

  connection.on('debug', function(text) {
    console.log(text);
  }).on('errorMessage', function(text) {
    console.log(JSON.stringify(text, null, 2));
  }).on('infoMessage', function(text) {
    console.log(JSON.stringify(text, null, 2));
  });

  connection.on('connect', function (err) {
    if (err) return callback(err);

    const request = new Request(query, function (err, rows) {
      if (err) return callback(err);
      // console.log('rows: ' + rows);
      callback(null, rows > 0);
    });

    bcrypt.hash(newPassword, 10, function (err, hash) {
      if (err) return callback(err);
      request.addParameter('NewPassword', TYPES.VarChar, hash);
      request.addParameter('Email', TYPES.VarChar, email);
      connection.execSql(request);
    });
  });
}
