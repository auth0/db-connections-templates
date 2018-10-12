'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'postgres';
const scriptName = 'change_password';

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

    script('broken@example.com', 'newPassword', (err) => {
      expect(close).toHaveBeenCalled();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should return hash error', (done) => {
    script('broken@example.com', null, (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('data and salt arguments required');
      done();
    });
  });

  it('should update hashed password', (done) => {
    query.mockImplementation((query, params, callback) => {
      expect(query).toEqual('UPDATE users SET password = $1 WHERE email = $2');
      expect(params[1]).toEqual('duck.t@example.com');
      expect(typeof params[0]).toEqual('string');
      expect(params[0].length).toEqual(60);
      callback(null, { rowCount: 1 });
    });

    script('duck.t@example.com', 'newPassword', (err, success) => {
      expect(close).toHaveBeenCalled();
      expect(err).toBeFalsy();
      expect(success).toEqual(true);
      done();
    });
  });
});
