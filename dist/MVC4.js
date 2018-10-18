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

      const createMembership =
        'INSERT INTO webpages_Membership ' +
        '(UserId, CreateDate, IsConfirmed, PasswordFailuresSinceLastSuccess, Password, PasswordSalt) ' +
        'VALUES ' +
        '(@UserId, GETDATE(), \'false\', 0, @Password, \'\')';

      const createMembershipQuery = new Request(createMembership, function (err, rowCount) {
        if (err || rowCount === 0) return callback(err);

        callback(null, rowCount > 0);
      });

      bcrypt.genSalt(10, function(err, salt) {
        if (err) return callback(err);

        bcrypt.hash(user.password, salt, function(err, hash) {
          if (err) return callback(err);

          createMembershipQuery.addParameter('Password', TYPES.VarChar, hash);
          createMembershipQuery.addParameter('PasswordSalt', TYPES.VarChar, salt);
          createMembershipQuery.addParameter('UserId', TYPES.VarChar, userId);

          connection.execSql(createMembershipQuery);
        });
      });
    });

    createUserQuery.addParameter('UserName', TYPES.VarChar, user.email);

    connection.execSql(createUserQuery);
  });
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

  connection.on('debug', function (text) {
    // if you have connection issues, uncomment this to get more detailed info
    // console.log(text);
  }).on('errorMessage', function (text) {
    // this will show any errors when connecting to the SQL database or with the SQL statements
    console.log(JSON.stringify(text));
  });

  connection.on('connect', function (err) {
    if (err) return callback(err);
    executeDelete(['webpages_Membership', 'UserProfile'], function (err) {
      if (err) return callback(err);
      callback(null);
    });
  });

  function executeDelete(tables, callback) {
    const query = tables.map(function (table) {
      return 'DELETE FROM ' + table + ' WHERE UserId = @UserId';
    }).join(';');
    const request = new Request(query, function (err) {
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
      'SELECT webpages_Membership.UserId, UserName, UserProfile.UserName from webpages_Membership ' +
      'INNER JOIN UserProfile ON UserProfile.UserId = webpages_Membership.UserId ' +
      'WHERE UserProfile.UserName = @Username';

    const getMembershipQuery = new Request(query, function (err, rowCount) {
      if (err) return callback(err);
      if (rowCount < 1) return callback();

      callback(null, user);
    });

    getMembershipQuery.addParameter('Username', TYPES.VarChar, email);

    getMembershipQuery.on('row', function (fields) {
      user = {
        user_id: fields.UserId.value,
        nickname: fields.UserName.value,
        email: fields.UserName.value
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
,
 verify: function verify (email, callback) {
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
      'WHERE UserName = @Username';

    const findUserIdFromEmailQuery = new Request(findUserIdFromEmail, function (err, rowCount, rows) {
      if (err || rowCount < 1) return callback(err);

      const userId = rows[0][0].value;

      callback(null, userId);
    });

    findUserIdFromEmailQuery.addParameter('Username', TYPES.VarChar, email);

    connection.execSql(findUserIdFromEmailQuery);
  }

  function verifyMembershipUser(email, callback) {
    findUserId(email, function (err, userId) {
      if (err || !userId) return callback(err);

      // isConfirmed field is the email verification flag
      const updateMembership =
        'UPDATE webpages_Membership SET isConfirmed = \'true\' ' +
        'WHERE isConfirmed = \'false\' AND UserId = @UserId';

      const updateMembershipQuery = new Request(updateMembership, function (err, rowCount) {
        return callback(err, rowCount > 0);
      });

      updateMembershipQuery.addParameter('UserId', TYPES.VarChar, userId);

      connection.execSql(updateMembershipQuery);
    });
  }
}
,
};
