function verify (email, callback) {
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

  connection.on('debug', function(text) {
    // if you have connection issues, uncomment this to get more detailed info
    //console.log(text);
  }).on('errorMessage', function(text) {
    // this will show any errors when connecting to the SQL database or with the SQL statements
    console.log(JSON.stringify(text));
  });

  connection.on('connect', function (err) {
    if (err) return callback(err);
    verifyMembershipUser(email, function(err, wasUpdated) {
      if (err) return callback(err); // this will return a 500

      callback(null, wasUpdated);
    });
  });

  function findUserId(email, callback) {
    const findUserIdFromEmail =
      'SELECT UserProfile.UserId FROM ' +
      'UserProfile INNER JOIN webpages_Membership ' +
      'ON UserProfile.UserId = webpages_Membership.UserId ' +
      'WHERE UserName = @Email';

    const findUserIdFromEmailQuery = new Request(findUserIdFromEmail, function (err, rowCount, rows) {
      if (err) return callback(err);

      // No record found with that email
      if (rowCount < 1) return callback(null, null);

      const userId = rows[0][0].value;

      callback(null, userId);
    });

    findUserIdFromEmailQuery.addParameter('Email', TYPES.VarChar, email);

    connection.execSql(findUserIdFromEmailQuery);
  }

  function verifyMembershipUser(email, callback) {
    findUserId(email, function (err, userId) {
      if (err) return callback(err);

      if(userId === null) return callback();

      // isConfirmed field is the email verification flag
      const updateMembership =
        'UPDATE webpages_Membership SET isConfirmed = \'true\' ' +
        'WHERE isConfirmed = \'false\' AND UserId = @UserId';

      const updateMembershipQuery = new Request(updateMembership, function (err, rowCount) {
        if (err) return callback(err);
        callback(null, rowCount > 0);
      });

      updateMembershipQuery.addParameter('UserId', TYPES.VarChar, userId);

      connection.execSql(updateMembershipQuery);
    });
  }
}
