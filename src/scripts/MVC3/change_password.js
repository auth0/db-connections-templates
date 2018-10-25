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
   * This function creates a hashed version of the password to store in the database.
   *
   * @password  {[string]}      the password entered by the user
   * @return    {[string]}      the hashed password
   */
  function hashPassword(password, salt) {
    // the default implementation uses HMACSHA256 and since Key length is 64
    // and default salt is 16 bytes, Membership will fill the buffer repeating the salt
    const key = Buffer.concat([salt, salt, salt, salt]);
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(Buffer.from(password, 'ucs2'));

    return hmac.digest('base64');
  }

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
    const salt = crypto.randomBytes(16);
    const hashedPassword = hashPassword(newPassword, salt);
    const updateMembership =
      'UPDATE Memberships ' +
      'SET Password=@NewPassword, PasswordSalt=@NewSalt, LastPasswordChangedDate=GETDATE() ' +
      'WHERE Email=@Email';

    const updateMembershipQuery = new Request(updateMembership, function(membershipErr, membershipCount) {
      if (membershipErr) return callback(membershipErr);

      callback(null, membershipCount > 0);
    });

    updateMembershipQuery.addParameter('NewPassword', TYPES.VarChar, hashedPassword);
    updateMembershipQuery.addParameter('NewSalt', TYPES.VarChar, salt);
    updateMembershipQuery.addParameter('Email', TYPES.VarChar, email);

    connection.execSql(updateMembershipQuery);
  }
}
