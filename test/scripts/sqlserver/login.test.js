'use strict';

const bcrypt = require('bcrypt');

const loadScript = require('../../utils/load-script');
const fakeSqlServer = require('../../utils/fake-db/sqlserver');

const dbType = 'sqlserver';
const scriptName = 'login';

describe(scriptName, () => {
  const user = {
    user_id: 'uid1',
    nickname: 'Terrified Duck',
    email: 'duck.t@example.com'
  };

  const sqlserver = fakeSqlServer({
    callback: (query, callback) => {
      expect(query).toContain('SELECT Id, Nickname, Email, Password FROM dbo.Users WHERE Email = ');

      if (query.indexOf('broken@example.com') > 0) {
        return callback(new Error('test db error'));
      }

      if (query.indexOf('missing@example.com') > 0) {
        return callback(null, 0, []);
      }

      if (query.indexOf('empty@example.com') > 0) {
        return callback(null, 1, [[
          { value: user.user_id },
          { value: user.nickname },
          { value: user.email },
          { value: null }
        ]]);
      }

      expect(query).toEqual('SELECT Id, Nickname, Email, Password FROM dbo.Users WHERE Email = duck.t@example.com');


      bcrypt.hash('password', 10, (err, hash) =>
        callback(null, 1, [[
          { value: user.user_id },
          { value: user.nickname },
          { value: user.email },
          { value: hash }
        ]])
      );
    }
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
    script('missing@example.com', 'password', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('missing@example.com');
      done();
    });
  });

  it('should return hash error', (done) => {
    script('empty@example.com', 'password', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('data and hash arguments required');
      done();
    });
  });

  it('should return error, if password is incorrect', (done) => {
    script('duck.t@example.com', 'wrongPassword', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('duck.t@example.com');
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
