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

  const applicationId = 'your-application-id-goes-here';

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

      const membershipData = {
        ApplicationId: applicationId,
        Email: user.email,
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

      bcrypt.genSalt(10, function(err, salt) {
        if (err) return callback(err);

        bcrypt.hash(user.password, salt, function(err, hash) {
          if (err) return callback(err);

          createMembershipQuery.addParameter('ApplicationId', TYPES.VarChar, membershipData.ApplicationId);
          createMembershipQuery.addParameter('Email', TYPES.VarChar, membershipData.Email);
          createMembershipQuery.addParameter('Password', TYPES.VarChar, hash);
          createMembershipQuery.addParameter('PasswordSalt', TYPES.VarChar, salt);
          createMembershipQuery.addParameter('UserId', TYPES.VarChar, membershipData.UserId);

          connection.execSql(createMembershipQuery);
        });
      });
    });

    createUserQuery.addParameter('UserName', TYPES.VarChar, userData.UserName);
    createUserQuery.addParameter('ApplicationId', TYPES.VarChar, userData.ApplicationId);

    connection.execSql(createUserQuery);
  }
}

