'use strict';

const loadScript = require('../../utils/load-script');
const fakeMysql = require('../../utils/fake-db/mysql');

const dbType = 'mysql';
const scriptName = 'change_password';

describe(scriptName, () => {
  const mysql = fakeMysql({
    query: (query, params, callback) => {
      expect(query).toEqual('UPDATE users SET password = ? WHERE email = ?');
      expect(typeof params[0]).toEqual('string');
      expect(typeof params[1]).toEqual('string');

      if (params[1] === 'broken@example.com') {
        return callback(new Error('test db error'));
      }

      expect(params[1]).toEqual('duck.t@example.com');

      return callback(null, [ { email: params[1] } ]);
    }
  });

  const globals = {};
  const stubs = { mysql };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return database error', (done) => {
    script('broken@example.com', 'newPassword', (err) => {
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
    script('duck.t@example.com', 'newPassword', (err, success) => {
      expect(err).toBeFalsy();
      expect(success).toEqual(true);
      done();
    });
  });
});
