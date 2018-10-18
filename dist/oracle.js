module.exports = {
 change_password: function changePassword(email, newPassword, callback) {
  const bcrypt = require('bcrypt');
  const oracledb = require('oracledb');
  oracledb.outFormat = oracledb.OBJECT;

  oracledb.getConnection({
      user: configuration.dbUser,
      password: configuration.dbUserPassword,
      connectString: 'CONNECTION_STRING' // Refer here https://github.com/oracle/node-oracledb/blob/master/doc/api.md#connectionstrings
    },
    function(err, connection) {
      if (err) callback(err);

      bcrypt.hash(newPassword, 10, function(err, hash) {
        if (err) return callback(err);

        const query = 'update Users set PASSWORD = :hash where EMAIL = :email';
        connection.execute(query, [hash, email], { autoCommit: true }, function(err, result) {
          doRelease(connection);
          callback(err, result && result.rowsAffected > 0);
        });
      });

      // Note: connections should always be released when not needed
      function doRelease(connection) {
        connection.close(
          function(err) {
            if (err) console.error(err.message);
          });
      }
    });
}
,
 create: function create(user, callback) {
  const bcrypt = require('bcrypt');
  const oracledb = require('oracledb');
  oracledb.outFormat = oracledb.OBJECT;

  oracledb.getConnection({
      user: configuration.dbUser,
      password: configuration.dbUserPassword,
      connectString: 'CONNECTION_STRING' // Refer here https://github.com/oracle/node-oracledb/blob/master/doc/api.md#connectionstrings
    },
    function(err, connection) {
      if (err) return callback(err);

      const selectQuery = 'select ID, EMAIL, PASSWORD, EMAIL_VERIFIED, NICKNAME from Users where EMAIL = :email';
      connection.execute(selectQuery, [user.email], function(err, result) {
        if (err || result.rows.length > 0) {
          doRelease(connection);
          return callback(err || new Error('User already exists'));
        }
        bcrypt.hash(user.password, 10, function(err, hash) {
          if (err) return callback(err);

          user.password = hash;
          const insertQuery = 'insert into Users (EMAIL, PASSWORD, EMAIL_VERIFIED, NICKNAME) values (:email, :password, :email_verified, :nickname)';
          const params = [user.email, user.password, 'false', user.email.substring(0, user.email.indexOf('@'))];
          connection.execute(insertQuery, params, { autoCommit: true }, function(err) {
            doRelease(connection);
            callback(err);
          });
        });

      });

      // Note: connections should always be released when not needed
      function doRelease(connection) {
        connection.close(
          function(err) {
            if (err) console.error(err.message);
          });
      }
    });
}
,
 delete: function remove(id, callback) {
  const oracledb = require('oracledb');
  oracledb.outFormat = oracledb.OBJECT;

  oracledb.getConnection({
      user: configuration.dbUser,
      password: configuration.dbUserPassword,
      connectString: 'CONNECTION_STRING' // Refer here https://github.com/oracle/node-oracledb/blob/master/doc/api.md#connectionstrings
    },
    function(err, connection) {
      if (err) return callback(err);

      const query = 'delete Users where ID = :id';
      connection.execute(query, [id], { autoCommit: true }, function(err) {
        doRelease(connection);
        callback(err);
      });

      // Note: connections should always be released when not needed
      function doRelease(connection) {
        connection.close(
          function(err) {
            if (err) console.error(err.message);
          });
      }
    });
}
,
 get_user: function loginByEmail(email, callback) {
  const oracledb = require('oracledb');
  oracledb.outFormat = oracledb.OBJECT;

  oracledb.getConnection({
      user: configuration.dbUser,
      password: configuration.dbUserPassword,
      connectString: 'CONNECTION_STRING' // Refer here https://github.com/oracle/node-oracledb/blob/master/doc/api.md#connectionstrings
    },
    function(err, connection) {
      if (err) return callback(err);

      const query = 'select ID, EMAIL, NICKNAME from Users where EMAIL = :email';
      connection.execute(query, [email], function(err, result) {
        doRelease(connection);

        if (err || result.rows.length === 0) return callback(err);

        const userProfile = {
          user_id: result.rows[0].ID,
          nickname: result.rows[0].NICKNAME,
          email: result.rows[0].EMAIL
        };
        callback(null, userProfile);
      });
    });

  // Note: connections should always be released when not needed
  function doRelease(connection) {
    connection.close(
      function(err) {
        if (err) console.error(err.message);
      });
  }
}
,
 login: function login(email, password, callback) {
  const bcrypt = require('bcrypt');
  const oracledb = require('oracledb');
  oracledb.outFormat = oracledb.OBJECT;

  oracledb.getConnection({
      user: configuration.dbUser,
      password: configuration.dbUserPassword,
      connectString: 'CONNECTION_STRING' // Refer here https://github.com/oracle/node-oracledb/blob/master/doc/api.md#connectionstrings
    },
    function(err, connection) {
      if (err) return callback(err);

      const query = 'select ID, EMAIL, PASSWORD, NICKNAME from Users where EMAIL = :email';
      connection.execute(query, [email], function(err, result) {
        doRelease(connection);

        if (err || result.rows.length === 0) return callback(err || new WrongUsernameOrPasswordError(email));

        bcrypt.compare(password, result.rows[0].PASSWORD, function(err, isValid) {
          if (err || !isValid) return callback(err || new WrongUsernameOrPasswordError(email));

          const userProfile = {
            user_id: result.rows[0].ID,
            nickname: result.rows[0].NICKNAME,
            email: result.rows[0].EMAIL
          };
          callback(null, userProfile);
        });
      });

      // Note: connections should always be released when not needed
      function doRelease(connection) {
        connection.close(
          function(err) {
            if (err) console.error(err.message);
          });
      }
    });
}
,
 verify: function verify(email, callback) {
  const oracledb = require('oracledb');
  oracledb.outFormat = oracledb.OBJECT;

  oracledb.getConnection({
      user: configuration.dbUser,
      password: configuration.dbUserPassword,
      connectString: 'CONNECTION_STRING' // Refer here https://github.com/oracle/node-oracledb/blob/master/doc/api.md#connectionstrings
    },
    function(err, connection) {
      if (err) return callback(err);

      const query = 'update Users set EMAIL_VERIFIED = \'true\' where EMAIL = :email and EMAIL_VERIFIED = \'false\'';
      connection.execute(query, [email], { autoCommit: true }, function(err, result) {
        doRelease(connection);
        callback(err, result && result.rowsAffected > 0);
      });

      // Note: connections should always be released when not needed
      function doRelease(connection) {
        connection.close(
          function(err) {
            if (err) console.error(err.message);
          });
      }
    });
}
,
};
