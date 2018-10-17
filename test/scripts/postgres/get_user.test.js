'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'postgres';
const scriptName = 'get_user';

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

  it('should return database error', (done) => {
    query.mockImplementation((query, params, callback) => callback(new Error('test db error')));

    script('broken@example.com', (err) => {
      expect(close).toHaveBeenCalled();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should return user data', (done) => {
    query.mockImplementation((query, params, callback) => {
      expect(query).toEqual('SELECT id, nickname, email FROM users WHERE email = $1');
      expect(params[0]).toEqual('duck.t@example.com');

      const row = {
        id: 'uid1',
        email: 'duck.t@example.com',
        nickname: 'T-Duck'
      };

      callback(null, { rows: [ row ] });
    });

    const expectedUser = {
      user_id: 'uid1',
      email: 'duck.t@example.com',
      nickname: 'T-Duck'
    };

    script('duck.t@example.com', (err, user) => {
      expect(close).toHaveBeenCalled();
      expect(err).toBeFalsy();
      expect(user).toEqual(expectedUser);
      done();
    });
  });
});
