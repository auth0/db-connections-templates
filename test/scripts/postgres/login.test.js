'use strict';

const bcrypt = require('bcrypt');

const loadScript = require('../../utils/load-script');

const dbType = 'postgres';
const scriptName = 'login';

describe(scriptName, () => {
  const query = jest.fn();
  const close = jest.fn();
  const pg = (conString, cb) => {
    expect(conString).toEqual('postgres://user:pass@localhost/mydb');

    cb(null, { query }, close);
  };

  const globals = { WrongUsernameOrPasswordError: Error };
  const stubs = { pg };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return database error', (done) => {
    query.mockImplementation((query, params, callback) => callback(new Error('test db error')));

    script('broken@example.com', 'password', (err) => {
      expect(close).toHaveBeenCalled();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should return error, if there is no such user', (done) => {
    query.mockImplementation((query, params, callback) => callback(null, { rows: [] }));

    script('missing@example.com', 'password', (err) => {
      expect(close).toHaveBeenCalled();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('missing@example.com');
      done();
    });
  });

  it('should return hash error', (done) => {
    query.mockImplementation((query, params, callback) => callback(null, { rows: [ {} ] }));

    script('empty@example.com', 'password', (err) => {
      expect(close).toHaveBeenCalled();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('data and hash arguments required');
      done();
    });
  });

  it('should return error, if password is incorrect', (done) => {
    query.mockImplementation((query, params, callback) => callback(null, { rows: [ { password: 'random-hash' } ] }));

    script('duck.t@example.com', 'wrongPassword', (err) => {
      expect(close).toHaveBeenCalled();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('duck.t@example.com');
      done();
    });
  });

  it('should return user data', (done) => {
    query.mockImplementation((query, params, callback) => {
      expect(query).toEqual('SELECT id, nickname, email, password FROM users WHERE email = $1');
      expect(params[0]).toEqual('duck.t@example.com');

      const row = {
        id: 'uid1',
        email: 'duck.t@example.com',
        nickname: 'T-Duck',
        password: bcrypt.hashSync('password', 10)
      };

      callback(null, { rows: [ row ] });
    });

    const expectedUser = {
      user_id: 'uid1',
      email: 'duck.t@example.com',
      nickname: 'T-Duck'
    };

    script('duck.t@example.com', 'password', (err, user) => {
      expect(close).toHaveBeenCalled();
      expect(err).toBeFalsy();
      expect(user).toEqual(expectedUser);
      done();
    });
  });
});
