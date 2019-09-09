'use strict';

const bcrypt = require('bcrypt');

const loadScript = require('../../utils/load-script');

const dbType = 'mongo';
const scriptName = 'login';

describe(scriptName, () => {
  const findOne = jest.fn();
  const MongoClient = function (conString) {
    expect(conString).toEqual('mongodb://user:pass@mymongoserver.com/my-db');

    this.close = () => null;
    this.connect = (cb) => cb();
    this.db = (dbName) => {
      expect(dbName).toEqual('db-name');
      return {
        collection: function (colName) {
          expect(colName).toEqual('users');
          return { findOne };
        }
      }
    };

    return this;
  };
  const globals = { WrongUsernameOrPasswordError: Error };
  const stubs = { 'mongodb@3.1.4': { MongoClient } };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return database error', (done) => {
    findOne.mockImplementation((query, callback) => callback(new Error('test db error')));

    script('broken@example.com', 'password', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should return error, if there is no such user', (done) => {
    findOne.mockImplementation((query, callback) => callback());

    script('missing@example.com', 'password', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('missing@example.com');
      done();
    });
  });

  it('should return hash error', (done) => {
    findOne.mockImplementation((query, callback) => callback(null, query));

    script('empty@example.com', 'password', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('data and hash arguments required');
      done();
    });
  });

  it('should return error, if password is incorrect', (done) => {
    findOne.mockImplementation((query, callback) =>
      callback(null, { _id: 'uid1', email: query.email, password: 'some-random-hash' }));

    script('duck.t@example.com', 'wrongPassword', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('duck.t@example.com');
      done();
    });
  });

  it('should return user data', (done) => {
    findOne.mockImplementation((query, callback) => {
      expect(query.email).toEqual('duck.t@example.com');

      callback(null, { _id: 'uid1', email: query.email, password: bcrypt.hashSync('password', 10) })
    });

    script('duck.t@example.com', 'password', (err, user) => {
      expect(err).toBeFalsy();
      expect(user.email).toEqual('duck.t@example.com');
      expect(user.user_id).toEqual('uid1');
      expect(user.password).toBeFalsy();
      done();
    });
  });
});
