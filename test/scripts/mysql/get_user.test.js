'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'mysql';
const scriptName = 'get_user';

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

  it('should return user data', (done) => {
    query.mockImplementation((query, params, callback) => {
      expect(query).toEqual('SELECT id, nickname, email FROM users WHERE email = ?');
      expect(params[0]).toEqual('duck.t@example.com');
      callback(null, [ { id: 'uid1', email: 'duck.t@example.com', nickname: 'T-Duck' } ]);
    });

    const expectedUser = {
      user_id: 'uid1',
      email: 'duck.t@example.com',
      nickname: 'T-Duck'
    };

    script('duck.t@example.com', (err, user) => {
      expect(connect).toHaveBeenCalled();
      expect(err).toBeFalsy();
      expect(user).toEqual(expectedUser);
      done();
    });
  });
});
