function create(user, callback) {
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
      encrypt: true,
      // Required to retrieve userId needed for Membership entity creation
      rowCollectionOnRequestCompletion: true
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

    crypto.pbkdf2(password, salt, iterations, passwordHashLength, 'sha256', function (err, hashed) {
      if (err) return callback(err);

      const result = Buffer.concat([Buffer.from([0], 1), salt, Buffer.from(hashed, 'binary')]);
      const resultBase64 = result.toString('base64');

      callback(null, resultBase64);
    });
  }

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
      const salt = crypto.randomBytes(16);

      const createMembership =
        'INSERT INTO webpages_Membership ' +
        '(UserId, CreateDate, IsConfirmed, PasswordFailuresSinceLastSuccess, Password, PasswordSalt) ' +
        'VALUES ' +
        '(@UserId, GETDATE(), \'false\', 0, @Password, \'\')';

      const createMembershipQuery = new Request(createMembership, function (err, rowCount) {
        if (err || rowCount === 0) return callback(err);

        callback(null, rowCount > 0);
      });

      hashPassword(user.password, salt, function (err, hashedPassword) {
        if (err) return callback(err);
        createMembershipQuery.addParameter('Password', TYPES.VarChar, hashedPassword);
        createMembershipQuery.addParameter('PasswordSalt', TYPES.VarChar, salt.toString('base64'));
        createMembershipQuery.addParameter('UserId', TYPES.VarChar, userId);

        connection.execSql(createMembershipQuery);
      });
    });

    createUserQuery.addParameter('UserName', TYPES.VarChar, user.email);

    connection.execSql(createUserQuery);
  });
}
