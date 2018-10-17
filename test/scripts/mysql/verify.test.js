'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'mysql';
const scriptName = 'verify';

describe(scriptName, () => {
  const query = jest.fn();
  const connect = jest.fn();
  const mysql = (options) => {
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

    script('broken@example.com', (err) => {
      expect(connect).toHaveBeenCalled();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should not update user, if email already validated', (done) => {
    query.mockImplementation((query, params, callback) => callback(null, []));

    script('validated@example.com', (err, success) => {
      expect(connect).toHaveBeenCalled();
      expect(err).toBeFalsy();
      expect(success).toEqual(false);
      done();
    });
  });

  it('should update user', (done) => {
    query.mockImplementation((query, params, callback) => {
      expect(query).toEqual('UPDATE users SET email_Verified = true WHERE email_Verified = false AND email = ?');
      expect(params[0]).toEqual('duck.t@example.com');
      callback(null, [ { email: 'duck.t@example.com' } ]);
    });

    script('duck.t@example.com', (err, success) => {
      expect(connect).toHaveBeenCalled();
      expect(err).toBeFalsy();
      expect(success).toEqual(true);
      done();
    });
  });
});
