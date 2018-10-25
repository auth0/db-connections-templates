function login(email, password, callback) {
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
      encrypt: true // for Windows Azure
    }
  });

  function fixedTimeComparison(a, b) {
    var mismatch = (a.length === b.length ? 0 : 1);
    if (mismatch) {
      b = a;
    }

    for (var i = 0, il = a.length; i < il; ++i) {
      const ac = a.charCodeAt(i);
      const bc = b.charCodeAt(i);
      mismatch += (ac === bc ? 0 : 1);
    }

    return (mismatch === 0);
  }


  /**
   * validatePassword
   *
   * This function gets the password entered by the user, and the original password
   * hash and salt from database and performs an HMAC SHA256 hash.
   *
   * @password      {[string]}      the password entered by the user
   * @originalHash  {[string]}      the original password hashed from the database
   *                                (including the salt).
   * @return        {[bool]}        true if password validates
   */
  function validatePassword(password, originalHash, callback) {
    const iterations = 1000;
    const hashBytes = Buffer.from(originalHash, 'base64');
    const salt = hashBytes.slice(1, 17);
    const hash = hashBytes.slice(17, 49);
    crypto.pbkdf2(password, salt, iterations, hash.length, 'sha1', function(err, hashed) {
      if (err) return callback(err);

      const hashedBase64 = Buffer.from(hashed, 'binary').toString('base64');
      const isValid = fixedTimeComparison(hash.toString('base64'), hashedBase64);

      return callback(null, isValid);
    });
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
    getMembershipUser(email, function(err, user) {
      if (err || !user || !user.profile) return callback(err || new WrongUsernameOrPasswordError(email));

      validatePassword(password, user.password, function(err, isValid) {
        if (err || !isValid) return callback(err || new WrongUsernameOrPasswordError(email));

        callback(null, user.profile);
      });
    });
  });


  // Membership Provider implementation used on Microsoft.AspNet.Providers NuGet

  /**
   * getMembershipUser
   *
   * This function gets a username or email and returns a user info, password hashes and salt
   *
   * @usernameOrEamil   {[string]}    the username or email, the method will do a query
   *                                  on both with an OR
   * @callback          {[Function]}  first argument will be the Error if any, and second
   *                                  argument will be a user object
   */
  function getMembershipUser(usernameOrEmail, done) {
    var user = null;
    const query =
      'SELECT webpages_Membership.UserId, UserName, UserProfile.UserName, Password from webpages_Membership ' +
      'INNER JOIN UserProfile ON UserProfile.UserId = webpages_Membership.UserId ' +
      'WHERE UserProfile.UserName = @Username';

    const getMembershipQuery = new Request(query, function(err, rowCount) {
      if (err || rowCount < 1) return done(err);

      done(err, user);
    });

    getMembershipQuery.addParameter('Username', TYPES.VarChar, usernameOrEmail);

    getMembershipQuery.on('row', function(fields) {
      user = {
        profile: {
          user_id: fields.UserId.value,
          nickname: fields.UserName.value,
          email: fields.UserName.value,
        },
        password: fields.Password.value
      };
    });

    connection.execSql(getMembershipQuery);
  }
}
