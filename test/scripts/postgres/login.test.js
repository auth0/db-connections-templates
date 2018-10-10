'use strict';

const bcrypt = require('bcrypt');

const loadScript = require('../../utils/load-script');
const fakePostgres = require('../../utils/fake-db/postgres');

const dbType = 'postgres';
const scriptName = 'login';

describe(scriptName, () => {
  const pg = fakePostgres({
    query: (query, params, callback) => {
      expect(query).toEqual('SELECT id, nickname, email, password FROM users WHERE email = $1');
      expect(params.length).toEqual(1);

      if (params[0] === 'broken@example.com') {
        return callback(new Error('test db error'));
      }

      if (params[0] === 'missing@example.com') {
        return callback(null, { rows: [] });
      }

      if (params[0] === 'empty@example.com') {
        return callback(null, { rows: [ {} ] });
      }

      expect(params[0]).toEqual('duck.t@example.com');

      const user = {
        id: 'uid1',
        email: 'duck.t@example.com',
        password: bcrypt.hashSync('password', 10)
      };
      return callback(null, { rows: [ user ] });
    }
  });

  const globals = { WrongUsernameOrPasswordError: Error };
  const stubs = { pg };

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
    script('duck.t@example.com', 'password', (err, user) => {
      expect(err).toBeFalsy();
      expect(user.id).toEqual('uid1');
      expect(user.email).toEqual('duck.t@example.com');
      expect(user.password).toBeFalsy();
      done();
    });
  });
});
