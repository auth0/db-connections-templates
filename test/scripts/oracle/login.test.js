'use strict';

const bcrypt = require('bcrypt');

const loadScript = require('../../utils/load-script');
const fakeOracle = require('../../utils/fake-db/oracle');

const dbType = 'oracle';
const scriptName = 'login';

describe(scriptName, () => {
  const oracledb = fakeOracle({
    execute: (query, params, callback) => {
      expect(query).toEqual('select ID, EMAIL, PASSWORD, EMAIL_VERIFIED, NICKNAME from Users where EMAIL = :email');
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

      bcrypt.hash('password', 10, (err, hash) => callback(null, { rows: [ {
          ID: 'uid1',
          EMAIL: 'duck.t@example.com',
          EMAIL_VERIFIED: true,
          PASSWORD: hash
        } ] }));
    }
  });

  const globals = {
    WrongUsernameOrPasswordError: Error,
    configuration: { dbUser: 'dbUser', dbUserPassword: 'dbUserPassword' }
  };
  const stubs = { oracledb };

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
      expect(user.email).toEqual('duck.t@example.com');
      expect(user.user_id).toEqual('uid1');
      expect(user.password).toBeFalsy();
      done();
    });
  });
});
