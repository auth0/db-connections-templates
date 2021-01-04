'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'mysql';
const scriptName = 'create';

describe(scriptName, () => {
  const query = jest.fn();
  const connect = jest.fn();
  const mysql = {};
  mysql.createConnection = (options) => {
    const expectedOptions = {
      host: 'localhost',
      user: 'me',
      password: 'secret',
      database: 'mydb'
    };
    expect(options).toEqual(expectedOptions);

    return {
      connect,
      query
    };
  };

  const globals = {};
  const stubs = { mysql };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return hash error', (done) => {
    script({ email: 'duck.t@example.com' }, (err) => {
      expect(connect).toHaveBeenCalled();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('data and salt arguments required');
      done();
    });
  });

  it('should return database error', (done) => {
    query.mockImplementation((query, params, callback) => callback(new Error('test db error')));

    script({ email: 'broken@example.com', password: 'password' }, (err) => {
      expect(connect).toHaveBeenCalled();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should create user', (done) => {
    query.mockImplementation((query, params, callback) => {
      expect(query).toEqual('INSERT INTO users SET ?');
      expect(params.email).toEqual('duck.t@example.com');
      expect(typeof params.password).toEqual('string');
      expect(params.password.length).toEqual(60);
      callback(null, [ { email: params.email } ]);
    });

    script({ email: 'duck.t@example.com', password: 'password' }, (err) => {
      expect(connect).toHaveBeenCalled();
      expect(err).toBeFalsy();
      done();
    });
  });
});
