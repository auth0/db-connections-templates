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

  const applicationId = 'your-application-id-goes-here';

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
    // console.log(text);
  }).on('errorMessage', function(text) {
    // this will show any errors when connecting to the SQL database or with the SQL statements
    console.log(JSON.stringify(text));
  });

  connection.on('connect', function(err) {
    if (err) {
      return callback(err);
    }
    createMembershipUser(user, function(err, user) {
      if (err) return callback(err); // this will return a 500
      if (!user) return callback(); // this will return a 401

      callback(null, user);
    });
  });

  function createMembershipUser(user, callback) {
    const userData = {
      UserName: user.email,
      ApplicationId: applicationId
    };
    const createUser =
      'INSERT INTO Users (UserName, LastActivityDate, ApplicationId, UserId, IsAnonymous) ' +
      'OUTPUT Inserted.UserId ' +
      'VALUES (@UserName, GETDATE(), @ApplicationId, NEWID(), \'false\')';

    const createUserQuery = new Request(createUser, function(err, rowCount, rows) {
      if (err) return callback(err);

      // No records added
      if (rowCount === 0) return callback(null);

      const userId = rows[0][0].value;
      const salt = crypto.randomBytes(16);
      const membershipData = {
        ApplicationId: applicationId,
        Email: user.email,
        Password: hashPassword(user.password, salt),
        PasswordSalt: salt.toString('base64'),
        UserId: userId
      };

      const createMembership =
        'INSERT INTO Memberships (ApplicationId, UserId, Password, PasswordFormat, ' +
        'PasswordSalt, Email, isApproved, isLockedOut, CreateDate, LastLoginDate, ' +
        'LastPasswordChangedDate, LastLockoutDate, FailedPasswordAttemptCount, ' +
        'FailedPasswordAttemptWindowStart, FailedPasswordAnswerAttemptCount, ' +
        'FailedPasswordAnswerAttemptWindowsStart) ' +
        'VALUES ' +
        '(@ApplicationId, @UserId, @Password, 1, @PasswordSalt, ' +
        '@Email, \'false\', \'false\', GETDATE(), GETDATE(), GETDATE(), GETDATE(), 0, 0, 0, 0)';

      const createMembershipQuery = new Request(createMembership, function(err, rowCount) {
        if (err) return callback(err);

        if (rowCount === 0) return callback(null);

        callback(null, rowCount > 0);
      });

      createMembershipQuery.addParameter('ApplicationId', TYPES.VarChar, membershipData.ApplicationId);
      createMembershipQuery.addParameter('Email', TYPES.VarChar, membershipData.Email);
      createMembershipQuery.addParameter('Password', TYPES.VarChar, membershipData.Password);
      createMembershipQuery.addParameter('PasswordSalt', TYPES.VarChar, membershipData.PasswordSalt);
      createMembershipQuery.addParameter('UserId', TYPES.VarChar, membershipData.UserId);

      connection.execSql(createMembershipQuery);
    });

    createUserQuery.addParameter('UserName', TYPES.VarChar, userData.UserName);
    createUserQuery.addParameter('ApplicationId', TYPES.VarChar, userData.ApplicationId);

    connection.execSql(createUserQuery);
  }
}
