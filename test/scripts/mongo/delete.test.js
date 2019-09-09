'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'mongo';
const scriptName = 'delete';

describe(scriptName, () => {
  const remove = jest.fn();
  const MongoClient = function (conString) {
    expect(conString).toEqual('mongodb://user:pass@mymongoserver.com');

    this.close = () => null;
    this.connect = (cb) => cb();
    this.db = (dbName) => {
      expect(dbName).toEqual('db-name');
      return {
        collection: function (colName) {
          expect(colName).toEqual('users');
          return { remove };
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
    remove.mockImplementation((query, callback) => callback(new Error('test db error')));

    script('broken', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should remove user', (done) => {
    remove.mockImplementation((query, callback) => {
      expect(query._id).toEqual('uid1');

      callback();
    });

    script('uid1', (err) => {
      expect(err).toBeFalsy();
      done();
    });
  });
});
