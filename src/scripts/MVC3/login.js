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
      if (err || !user || !user.profile < 1) return callback(err || new WrongUsernameOrPasswordError(email));

      const salt = Buffer.from(user.password.salt, 'base64');
      const isPasswordValid = hashPassword(password, salt).toString('base64') === user.password.password;

      if (!isPasswordValid) return callback(new WrongUsernameOrPasswordError(email)); // this will return a 401

      return callback(null, user.profile);
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
      'SELECT Memberships.UserId, Email, Users.UserName, Password, PasswordSalt ' +
      'FROM Memberships INNER JOIN Users ' +
      'ON Users.UserId = Memberships.UserId ' +
      'WHERE Memberships.Email = @Username OR Users.UserName = @Username';

    const getMembershipQuery = new Request(query, function(err) {
      done(err, user);
    });

    getMembershipQuery.addParameter('Username', TYPES.VarChar, usernameOrEmail);

    getMembershipQuery.on('row', function(fields) {
      user = {
        profile: {
          user_id: fields.UserId.value,
          nickname: fields.UserName.value,
          name: fields.UserName.value,
          email: fields.Email.value,
        },
        password: {
          password: fields.Password.value,
          salt: fields.PasswordSalt.value
        }
      };
    });

    connection.execSql(getMembershipQuery);
  }

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
    const hashed = hmac.digest('base64');

    return hashed;
  }
}
