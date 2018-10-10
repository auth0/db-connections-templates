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

  connection.on('debug', function(text) {
    // if you have connection issues, uncomment this to get more detailed info
    //console.log(text);
  }).on('errorMessage', function(text) {
    // this will show any errors when connecting to the SQL database or with the SQL statements
    console.log(JSON.stringify(text));
  });

  connection.on('connect', function(err) {
    if (err) return callback(err);

    updateMembershipUser(email, newPassword, function(err, wasUpdated) {
      if (err) return callback(err); // this will return a 500

      callback(null, wasUpdated);
    });
  });

  function updateMembershipUser(email, newPassword, callback) {
    const updateMembership =
      'UPDATE Memberships ' +
      'SET Password=@NewPassword, PasswordSalt=@NewSalt, LastPasswordChangedDate=GETDATE() ' +
      'WHERE Email=@Email';

    const updateMembershipQuery = new Request(updateMembership, function(membershipErr, membershipCount) {
      if (membershipErr) return callback(membershipErr);

      callback(null, membershipCount > 0);
    });

    bcrypt.genSalt(10, function(err, salt) {
      if (err) return callback(err);

      bcrypt.hash(newPassword, salt, function(err, hash) {
        if (err) return callback(err);

        updateMembershipQuery.addParameter('NewPassword', TYPES.VarChar, hash);
        updateMembershipQuery.addParameter('NewSalt', TYPES.VarChar, salt);
        updateMembershipQuery.addParameter('Email', TYPES.VarChar, email);

        connection.execSql(updateMembershipQuery);
      });
    });
  }
}
