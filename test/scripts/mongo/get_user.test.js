'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'mongo';
const scriptName = 'get_user';

describe(scriptName, () => {
  const findOne = jest.fn();
  const MongoClient = function (conString) {
    expect(conString).toEqual('mongodb://user:pass@mymongoserver.com');

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
  const globals = {};
  const stubs = { 'mongodb@3.1.4': { MongoClient } };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return database error', (done) => {
    findOne.mockImplementation((query, callback) => callback(new Error('test db error')));

    script('broken@example.com', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should return user data', (done) => {
    findOne.mockImplementation((query, callback) => {
      expect(query.email).toEqual('duck.t@example.com');

      return callback(null, { _id: 'uid1', email: 'duck.t@example.com', nickname: 'Terrified Duck' });
    });

    const expectedUser = {
      user_id: 'uid1',
      email: 'duck.t@example.com',
      nickname: 'Terrified Duck'
    };

    script('duck.t@example.com', (err, user) => {
      expect(err).toBeFalsy();
      expect(user).toEqual(expectedUser);
      done();
    });
  });
});
