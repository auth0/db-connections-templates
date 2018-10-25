function changePassword(email, newPassword, callback) {
  const crypto = require('crypto');
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

  /**
   * hashPassword
   *
   * This function hashes a password using HMAC SHA256 algorythm.
   *
   * @password    {[string]}    password to be hased
   * @salt        {[string]}    salt to be used in the hashing process
   * @callback    {[function]}  callback to be called after hashing the password
   */
  function hashPassword(password, salt, callback) {
    const iterations = 1000;
    const passwordHashLength = 32;

    crypto.pbkdf2(password, salt, iterations, passwordHashLength, 'sha1', function (err, hashed) {
      if (err) return callback(err);

      const result = Buffer.concat([Buffer.from([0], 1), salt, Buffer.from(hashed, 'binary')]);
      const resultBase64 = result.toString('base64');

      callback(null, resultBase64);
    });
  }

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

      const salt = crypto.randomBytes(16);

      const updateMembership =
        'UPDATE webpages_Membership ' +
        'SET Password=@NewPassword, PasswordChangedDate=GETDATE() ' +
        'WHERE UserId=@UserId';

      const updateMembershipQuery = new Request(updateMembership, function (err, rowCount) {
        callback(err, rowCount > 0);
      });

      hashPassword(newPassword, salt, function (err, hashedPassword) {
        if (err) return callback(err);

        updateMembershipQuery.addParameter('NewPassword', TYPES.VarChar, hashedPassword);
        updateMembershipQuery.addParameter('UserId', TYPES.VarChar, userId);

        connection.execSql(updateMembershipQuery);
      });
    });
  }
}
