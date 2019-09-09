'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'mongo';
const scriptName = 'change_password';

describe(scriptName, () => {
  const update = jest.fn();
  const MongoClient = function (conString) {
    expect(conString).toEqual('mongodb://user:pass@mymongoserver.com/my-db');

    this.close = () => null;
    this.connect = (cb) => cb();
    this.db = (dbName) => {
      expect(dbName).toEqual('db-name');
      return {
        collection: function (colName) {
          expect(colName).toEqual('users');
          return { update };
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
    update.mockImplementation((query, data, callback) => callback(new Error('test db error')));

    script('broken@example.com', 'newPassword', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should return hash error', (done) => {
    script('broken@example.com', null, (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('data and salt arguments required');
      done();
    });
  });

  it('should update hashed password', (done) => {
    update.mockImplementation((query, data, callback) => {
      expect(query.email).toEqual('duck.t@example.com');
      expect(typeof data.$set.password).toEqual('string');
      expect(data.$set.password.length).toEqual(60);

      return callback(null, 1);
    });

    script('duck.t@example.com', 'newPassword', (err, success) => {
      expect(err).toBeFalsy();
      expect(success).toEqual(true);
      done();
    });
  });
});
