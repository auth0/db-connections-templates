'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'mysql';
const scriptName = 'change_password';

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

  it('should return database error', (done) => {
    query.mockImplementation((query, params, callback) => callback(new Error('test db error')));

    script('broken@example.com', 'newPassword', (err) => {
      expect(connect).toHaveBeenCalled();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should return hash error', (done) => {
    script('broken@example.com', null, (err) => {
      expect(connect).toHaveBeenCalled();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('data and salt arguments required');
      done();
    });
  });

  it('should update hashed password', (done) => {
    query.mockImplementation((query, params, callback) => {
      expect(query).toEqual('UPDATE users SET password = ? WHERE email = ?');
      expect(typeof params[0]).toEqual('string');
      expect(params[0].length).toEqual(60);
      expect(params[1]).toEqual('duck.t@example.com');

      callback(null, [ { email: params[1] } ]);
    });

    script('duck.t@example.com', 'newPassword', (err, success) => {
      expect(connect).toHaveBeenCalled();
      expect(err).toBeFalsy();
      expect(success).toEqual(true);
      done();
    });
  });
});
