function changePassword(email, newPassword, callback) {
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
      // encrypt: true for Windows Azure enable this
    }
  });

  connection.on('debug', function (text) {
    // if you have connection issues, uncomment this to get more detailed info
    //console.log(text);
  }).on('errorMessage', function (text) {
    // this will show any errors when connecting to the SQL database or with the SQL statements
    console.log(JSON.stringify(text));
  });

  connection.on('connect', function (err) {
    if (err) return callback(err);

    updateMembershipUser(email, newPassword, function (err, wasUpdated) {
      if (err) return callback(err); // this will return a 500

      callback(null, wasUpdated);
    });
  });

  function findUserId(email, callback) {
    const findUserIdFromEmail =
      'SELECT UserProfile.UserId FROM ' +
      'UserProfile INNER JOIN webpages_Membership ' +
      'ON UserProfile.UserId=webpages_Membership.UserId ' +
      'WHERE UserName=@Email';

    const findUserIdFromEmailQuery = new Request(findUserIdFromEmail, function (err, rowCount, rows) {
      if (err || rowCount < 1) return callback(err);

      const userId = rows[0][0].value;

      callback(null, userId);
    });

    findUserIdFromEmailQuery.addParameter('Email', TYPES.VarChar, email);

    connection.execSql(findUserIdFromEmailQuery);
  }

  function updateMembershipUser(email, newPassword, callback) {
    findUserId(email, function (err, userId) {
      if (err || !userId) return callback(err);

      const updateMembership =
        'UPDATE webpages_Membership ' +
        'SET Password=@NewPassword, PasswordChangedDate=GETDATE() ' +
        'WHERE UserId=@UserId';

      const updateMembershipQuery = new Request(updateMembership, function (err, rowCount) {
        callback(err, rowCount > 0);
      });

      bcrypt.hash(newPassword, 10, function(err, hash) {
        if (err) return callback(err);

        updateMembershipQuery.addParameter('NewPassword', TYPES.VarChar, hash);
        updateMembershipQuery.addParameter('UserId', TYPES.VarChar, userId);

        connection.execSql(updateMembershipQuery);
      });
    });
  }
}
