function create(user, callback) {
  const bcrypt = require('bcrypt');
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

    const createUser =
      'INSERT INTO UserProfile (UserName) ' +
      'OUTPUT Inserted.UserId ' +
      'VALUES (@UserName)';

    const createUserQuery = new Request(createUser, function (err, rowCount, rows) {
      if (err || rowCount === 0) return callback(err);

      const userId = rows[0][0].value;

      const createMembership =
        'INSERT INTO webpages_Membership ' +
        '(UserId, CreateDate, IsConfirmed, PasswordFailuresSinceLastSuccess, Password, PasswordSalt) ' +
        'VALUES ' +
        '(@UserId, GETDATE(), \'false\', 0, @Password, \'\')';

      const createMembershipQuery = new Request(createMembership, function (err, rowCount) {
        if (err || rowCount === 0) return callback(err);

        callback(null, rowCount > 0);
      });

      bcrypt.genSalt(10, function(err, salt) {
        if (err) return callback(err);

        bcrypt.hash(user.password, salt, function(err, hash) {
          if (err) return callback(err);

          createMembershipQuery.addParameter('Password', TYPES.VarChar, hash);
          createMembershipQuery.addParameter('PasswordSalt', TYPES.VarChar, salt);
          createMembershipQuery.addParameter('UserId', TYPES.VarChar, userId);

          connection.execSql(createMembershipQuery);
        });
      });
    });

    createUserQuery.addParameter('UserName', TYPES.VarChar, user.email);

    connection.execSql(createUserQuery);
  });
}
