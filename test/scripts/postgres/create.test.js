'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'postgres';
const scriptName = 'create';

describe(scriptName, () => {
  const query = jest.fn();
  const close = jest.fn();
  const pg = (conString, cb) => {
    expect(conString).toEqual('postgres://user:pass@localhost/mydb');

    cb(null, { query }, close);
  };

  const globals = {};
  const stubs = { pg };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return hash error', (done) => {
    script({ email: 'duck.t@example.com' }, (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('data and salt arguments required');
      done();
    });
  });

  it('should return database error', (done) => {
    query.mockImplementation((query, params, callback) => callback(new Error('test db error')));

    script({ email: 'broken@example.com', password: 'password' }, (err) => {
      expect(close).toHaveBeenCalled();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should create user', (done) => {
    query.mockImplementation((query, params, callback) => {
      expect(query).toEqual('INSERT INTO users(email, password) VALUES ($1, $2)');
      expect(params[0]).toEqual('duck.t@example.com');
      expect(typeof params[1]).toEqual('string');
      expect(params[1].length).toEqual(60);
      callback(null, { rowCount: 1 });
    });

    script({ email: 'duck.t@example.com', password: 'password' }, (err) => {
      expect(close).toHaveBeenCalled();
      expect(err).toBeFalsy();
      done();
    });
  });
});
