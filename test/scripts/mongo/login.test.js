'use strict';

const bcrypt = require('bcrypt');

const loadScript = require('../../utils/load-script');
const fakeMongo = require('../../utils/fake-db/mongodb');

const dbType = 'mongo';
const scriptName = 'login';

describe(scriptName, () => {
  const mongodb = fakeMongo({
    findOne: (query, callback) => {
      expect(typeof query).toEqual('object');

      if (query.email === 'broken@example.com') {
        return callback(new Error('test db error'));
      }

      if (query.email === 'missing@example.com') {
        return callback();
      }

      if (query.email === 'empty@example.com') {
        return callback(null, query);
      }

      expect(query.email).toEqual('duck.t@example.com');

      bcrypt.hash('password', 10, (err, hash) => callback(null, { _id: 'uid1', email: query.email, password: hash }));
    }
  });

  const globals = { WrongUsernameOrPasswordError: Error };
  const stubs = { mongodb };

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
