'use strict';

const bcrypt = require('bcrypt');

const loadScript = require('../../utils/load-script');
const fakeSqlServer = require('../../utils/fake-db/sqlserver');

const dbType = 'MVC3';
const scriptName = 'login';

describe(scriptName, () => {
  const user = {
    user_id: 'uid1',
    name: 'Terrified Duck',
    nickname: 'Terrified Duck',
    email: 'duck.t@example.com'
  };

  const sqlserver = fakeSqlServer({
    callback: (query, callback) => {
      expect(query).toContain('SELECT Memberships.UserId, Email, Users.UserName, Password FROM Memberships');

      if (query.indexOf('broken@example.com') > 0) {
        return callback(new Error('test db error'));
      }

      if (query.indexOf('missing@example.com') > 0) {
        return callback(null, 0);
      }

      expect(query).toContain('WHERE Memberships.Email = duck.t@example.com OR Users.UserName = duck.t@example.com');

      callback(null, 1);
    },
    row: (callback) => callback({
      UserId: { value: user.user_id },
      UserName: { value: user.name },
      Email: { value: user.email },
      Password: { value: bcrypt.hashSync('password', 10) }
    })
  });

  const globals = { WrongUsernameOrPasswordError: Error };
  const stubs = { 'tedious@1.11.0': sqlserver };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return database error', (done) => {
    script('broken@example.com', 'password', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should return error, if there is no such user', (done) => {
    script('missing@example.com', 'password', (err, result) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('missing@example.com');
      expect(result).toBeFalsy();
      done();
    });
  });

  it('should return error, if password is incorrect', (done) => {
    script('duck.t@example.com', 'wrongPassword', (err, result) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('duck.t@example.com');
      expect(result).toBeFalsy();
      done();
    });
  });

  it('should return user data', (done) => {
    script('duck.t@example.com', 'password', (err, result) => {
      expect(err).toBeFalsy();
      expect(result).toEqual(user);
      expect(user.password).toBeFalsy();
      done();
    });
  });
});
