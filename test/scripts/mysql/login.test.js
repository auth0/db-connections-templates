'use strict';

const bcrypt = require('bcrypt');

const loadScript = require('../../utils/load-script');
const fakeMysql = require('../../utils/fake-db/mysql');

const dbType = 'mysql';
const scriptName = 'login';

describe(scriptName, () => {
  const user = {
    id: 'uid1',
    email: 'duck.t@example.com',
    nickname: 'Terrified Duck'
  };

  const mysql = fakeMysql({
    query: (query, params, callback) => {
      expect(query).toEqual('SELECT id, nickname, email, password FROM users WHERE email = ?');
      expect(typeof params[0]).toEqual('string');

      if (params[0] === 'broken@example.com') {
        return callback(new Error('test db error'));
      }

      if (params[0] === 'missing@example.com') {
        return callback(null, []);
      }

      if (params[0] === 'empty@example.com') {
        return callback(null, [ user ]);
      }

      expect(params[0]).toEqual('duck.t@example.com');

      bcrypt.hash('password', 10, (err, hash) => callback(null, [ { ...user, password: hash } ]));
    }
  });

  const globals = { WrongUsernameOrPasswordError: Error };
  const stubs = { mysql };

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
