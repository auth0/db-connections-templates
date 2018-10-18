module.exports = {
 change_password: function changePassword(email, newPassword, callback) {
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
,
 create: function create(user, callback) {
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

,
 delete: function remove(id, callback) {
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
    // console.log(text);
  }).on('errorMessage', function(text) {
    // this will show any errors when connecting to the SQL database or with the SQL statements
    console.log(JSON.stringify(text));
  });

  connection.on('connect', function(err) {
    if (err) return callback(err);

    executeDelete(['Memberships', 'Users'], function(err) {
      if (err) return callback(err);

      callback(null);
    });
  });

  function executeDelete(tables, callback) {
    const query = tables.map(function(table) {
      return 'DELETE FROM ' + table + ' WHERE UserId = @UserId';
    }).join(';');
    const request = new Request(query, function(err) {
      if (err) return callback(err);

      callback(null);
    });
    request.addParameter('UserId', TYPES.VarChar, id);
    connection.execSql(request);
  }
}
,
 get_user: function getByEmail (email, callback) {
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

  connection.on('debug', function(text) {
    // if you have connection issues, uncomment this to get more detailed info
    //console.log(text);
  }).on('errorMessage', function(text) {
    // this will show any errors when connecting to the SQL database or with the SQL statements
    console.log(JSON.stringify(text));
  });

  connection.on('connect', function(err) {
    if (err) return callback(err);

    var user = {};
    const query =
      'SELECT Memberships.UserId, Email, Users.UserName ' +
      'FROM Memberships INNER JOIN Users ' +
      'ON Users.UserId = Memberships.UserId ' +
      'WHERE Memberships.Email = @Username OR Users.UserName = @Username';

    const getMembershipQuery = new Request(query, function(err, rowCount) {
      if (err) return callback(err);
      if (rowCount < 1) return callback();

      callback(null, user);
    });

    getMembershipQuery.addParameter('Username', TYPES.VarChar, email);

    getMembershipQuery.on('row', function(fields) {
      user = {
        user_id: fields.UserId.value,
        nickname: fields.UserName.value,
        email: fields.Email.value
      };
    });

    connection.execSql(getMembershipQuery);
  });
}
,
 login: function login(email, password, callback) {
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
      encrypt: true // for Windows Azure
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

    getMembershipUser(email, function(err, user) {
      if (err || !user || !user.profile) return callback(err || new WrongUsernameOrPasswordError(email));

      bcrypt.compare(password, user.password, function (err, isValid) {
        if (err || !isValid) return callback(err || new WrongUsernameOrPasswordError(email));

        return callback(null, user.profile);
      });
    });
  });


  // Membership Provider implementation used on Microsoft.AspNet.Providers NuGet

  /**
   * getMembershipUser
   *
   * This function gets a username or email and returns a the user membership provider
   * info, password hashes and salt
   *
   * @usernameOrEmail  {[string]}       the username or email, the method will do a
   *                                    query on both with an OR
   *
   * @callback         {[Function]}     first argument will be the Error if any,
   *                                    and second argument will be a user object
   */
  function getMembershipUser(usernameOrEmail, done) {
    var user = null;
    const query =
      'SELECT Memberships.UserId, Email, Users.UserName, Password ' +
      'FROM Memberships INNER JOIN Users ' +
      'ON Users.UserId = Memberships.UserId ' +
      'WHERE Memberships.Email = @Username OR Users.UserName = @Username';

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
          email: fields.Email.value,
        },
        password: fields.Password.value
      };
    });

    connection.execSql(getMembershipQuery);
  }
}
,
 verify: function verify(email, callback) {
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

  connection.on('connect', function(err) {
    if (err) return callback(err);

    verifyMembershipUser(email, function(err, wasUpdated) {
      if (err) return callback(err); // this will return a 500

      callback(null, wasUpdated);
    });
  });

  function verifyMembershipUser(email, callback) {
    // isApproved field is the email verification flag
    const updateMembership =
      'UPDATE Memberships SET isApproved = \'true\' ' +
      'WHERE isApproved = \'false\' AND Email = @Email';

    const updateMembershipQuery = new Request(updateMembership, function(err, rowCount) {
      if (err) {
        return callback(err);
      }
      callback(null, rowCount > 0);
    });

    updateMembershipQuery.addParameter('Email', TYPES.VarChar, email);

    connection.execSql(updateMembershipQuery);
  }
}
,
};
