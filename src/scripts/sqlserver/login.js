function login(email, password, callback) {
  //this example uses the "tedious" library
  //more info here: http://pekim.github.io/tedious/index.html
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

  const query = 'SELECT Id, Nickname, Email, Password FROM dbo.Users WHERE Email = @Email';

  connection.on('debug', function (text) {
    console.log(text);
  }).on('errorMessage', function (text) {
    console.log(JSON.stringify(text, null, 2));
  }).on('infoMessage', function (text) {
    console.log(JSON.stringify(text, null, 2));
  });

  connection.on('connect', function (err) {
    if (err) return callback(err);

    const request = new Request(query, function (err, rowCount, rows) {
      if (err || rowCount < 1) return callback(err || new WrongUsernameOrPasswordError(email));

      bcrypt.compare(password, rows[0][3].value, function (err, isValid) {
        if (err || !isValid) return callback(err || new WrongUsernameOrPasswordError(email));

        callback(null, {
          user_id: rows[0][0].value,
          nickname: rows[0][1].value,
          email: rows[0][2].value
        });
      });
    });

    request.addParameter('Email', TYPES.VarChar, email);
    connection.execSql(request);
  });
}
