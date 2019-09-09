'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'mongo';
const scriptName = 'create';

describe(scriptName, () => {
  const findOne = jest.fn();
  const insert = jest.fn();
  const MongoClient = function (conString) {
    expect(conString).toEqual('mongodb://user:pass@mymongoserver.com');

    this.close = () => null;
    this.connect = (cb) => cb();
    this.db = (dbName) => {
      expect(dbName).toEqual('db-name');
      return {
        collection: function (colName) {
          expect(colName).toEqual('users');
          return { findOne, insert };
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

  it('should return findOne database error', (done) => {
    findOne.mockImplementation((query, callback) => callback(new Error('test findOne error')));

    script({ email: 'broken@example.com' }, (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test findOne error');
      done();
    });
  });

  it('should return error, if user already exists', (done) => {
    findOne.mockImplementation((query, callback) => callback(null, { email: 'exists@example.com' }));

    script({ email: 'exists@example.com' }, (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('the user already exists');
      done();
    });
  });

  it('should return hash error', (done) => {
    findOne.mockImplementation((query, callback) => callback());

    script({ email: 'broken@example.com' }, (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('data and salt arguments required');
      done();
    });
  });

  it('should return insert database error', (done) => {
    findOne.mockImplementation((query, callback) => callback());
    insert.mockImplementation((query, callback) => callback(new Error('test insert error')));

    script({ email: 'broken@example.com', password: 'password' }, (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test insert error');
      done();
    });
  });

  it('should create user', (done) => {
    findOne.mockImplementation((query, callback) => {
      expect(query.email).toEqual('duck.t@example.com');
      callback();
    });
    insert.mockImplementation((data, callback) => {
      expect(data.email).toEqual('duck.t@example.com');
      expect(typeof data.password).toEqual('string');
      expect(data.password.length).toEqual(60);
      callback();
    });

    script({ email: 'duck.t@example.com', password: 'password' }, (err) => {
      expect(err).toBeFalsy();
      done();
    });
  });
});
