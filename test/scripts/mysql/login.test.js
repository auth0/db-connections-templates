'use strict';

const bcrypt = require('bcrypt');

const loadScript = require('../../utils/load-script');

const dbType = 'mysql';
const scriptName = 'login';

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

  const globals = { WrongUsernameOrPasswordError: Error };
  const stubs = { mysql };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return database error', (done) => {
    query.mockImplementation((query, params, callback) => callback(new Error('test db error')));

    script('broken@example.com', 'password', (err) => {
      expect(connect).toHaveBeenCalled();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should return error, if there is no such user', (done) => {
    query.mockImplementation((query, params, callback) => callback(null, []));

    script('missing@example.com', 'password', (err) => {
      expect(connect).toHaveBeenCalled();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('missing@example.com');
      done();
    });
  });

  it('should return hash error', (done) => {
    query.mockImplementation((query, params, callback) => callback(null, [{}]));

    script('empty@example.com', 'password', (err) => {
      expect(connect).toHaveBeenCalled();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('data and hash arguments required');
      done();
    });
  });

  it('should return error, if password is incorrect', (done) => {
    query.mockImplementation((query, params, callback) => callback(null, [{ password: 'random-hash' }]));

    script('duck.t@example.com', 'wrongPassword', (err) => {
      expect(connect).toHaveBeenCalled();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('duck.t@example.com');
      done();
    });
  });

  it('should return user data', (done) => {
    query.mockImplementation((query, params, callback) => {
      expect(query).toEqual('SELECT id, nickname, email, password FROM users WHERE email = ?');
      expect(params[0]).toEqual('duck.t@example.com');
      callback(null, [ { id: 'uid1', email: 'duck.t@example.com', nickname: 'T-Duck', password: bcrypt.hashSync('password', 10) } ]);
    });

    const expectedUser = {
      user_id: 'uid1',
      email: 'duck.t@example.com',
      nickname: 'T-Duck'
    };

    script('duck.t@example.com', 'password', (err, user) => {
      expect(connect).toHaveBeenCalled();
      expect(err).toBeFalsy();
      expect(user).toEqual(expectedUser);
      done();
    });
  });
});
