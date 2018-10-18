module.exports = {
 change_password: function changePassword (email, newPassword, callback) {
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
      console.log('rows: ' + rows);
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
,
 create: function create (user, callback) {
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

  const query = 'INSERT INTO dbo.Users SET Email = @Email, Password = @Password';

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
      console.log('rows: ' + rows);
      callback(null);
    });

    bcrypt.hash(user.password, 10, function(err, hash) {
      if (err) return callback(err);
      request.addParameter('Email', TYPES.VarChar, user.email);
      request.addParameter('Password', TYPES.VarChar, hash);
      connection.execSql(request);
    });
  });
}
,
 delete: function remove (id, callback) {
  // this example uses the "tedious" library
  // more info here: http://pekim.github.io/tedious/index.html
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

  const query = 'DELETE FROM dbo.Users WHERE id = @UserId';

  connection.on('debug', function (text) {
    console.log(text);
  }).on('errorMessage', function (text) {
    console.log(JSON.stringify(text, null, 2));
  }).on('infoMessage', function (text) {
    console.log(JSON.stringify(text, null, 2));
  });

  connection.on('connect', function (err) {
    if (err) return callback(err);

    const request = new Request(query, function (err) {
      if (err) return callback(err);
      callback(null);
    });

    request.addParameter('UserId', TYPES.VarChar, id);

    connection.execSql(request);
  });
}
,
 get_user: function getByEmail(email, callback) {
  //this example uses the "tedious" library
  //more info here: http://pekim.github.io/tedious/index.html
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

    const request = new Request(query, function (err, rowCount, rows) {
      if (err) return callback(err);

      callback(null, {
        user_id: rows[0][0].value,
        nickname: rows[0][1].value,
        email: rows[0][2].value
      });
    });

    request.addParameter('Email', TYPES.VarChar, email);
    connection.execSql(request);
  });
}
,
 login: function login(email, password, callback) {
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
,
 verify: function verify (email, callback) {
  //this example uses the "tedious" library
  //more info here: http://pekim.github.io/tedious/index.html
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

  const query = 'UPDATE dbo.Users SET Email_Verified = true WHERE Email_Verified = false AND Email = @Email';

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
      console.log('rows: ' + rows);
      callback(null, rows > 0);
    });

    request.addParameter('Email', TYPES.VarChar, email);

    connection.execSql(request);
  });
}
,
};
