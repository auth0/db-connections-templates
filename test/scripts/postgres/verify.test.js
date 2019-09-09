'use strict';


const loadScript = require('../../utils/load-script');

const dbType = 'postgres';
const scriptName = 'verify';

describe(scriptName, () => {
  const query = jest.fn();
  const close = jest.fn();
  const pg = {
    connect: (conString, cb) => {
      expect(conString).toEqual('postgres://user:pass@localhost/mydb');

      cb(null, { query }, close);
    }
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

  it('should not update user, if email already validated', (done) => {
    query.mockImplementation((query, params, callback) => callback(null, { rowCount: 0 }));

    script('validated@example.com', (err, success) => {
      expect(close).toHaveBeenCalled();
      expect(err).toBeFalsy();
      expect(success).toEqual(false);
      done();
    });
  });

  it('should update user', (done) => {
    query.mockImplementation((query, params, callback) => {
      expect(query).toEqual('UPDATE users SET email_Verified = true WHERE email_Verified = false AND email = $1');
      expect(params[0]).toEqual('duck.t@example.com');
      callback(null, { rowCount: 1 });
    });

    script('duck.t@example.com', (err, success) => {
      expect(close).toHaveBeenCalled();
      expect(err).toBeFalsy();
      expect(success).toEqual(true);
      done();
    });
  });
});
