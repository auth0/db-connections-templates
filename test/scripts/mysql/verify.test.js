'use strict';

const loadScript = require('../../utils/load-script');
const fakeMysql = require('../../utils/fake-db/mysql');

const dbType = 'mysql';
const scriptName = 'verify';

describe(scriptName, () => {
  const mysql = fakeMysql({
    query: (query, params, callback) => {
      expect(query).toEqual('UPDATE users SET email_Verified = true WHERE email_Verified = false AND email = ?');
      expect(typeof params[0]).toEqual('string');

      if (params[0] === 'broken@example.com') {
        return callback(new Error('test db error'));
      }

      if (params[0] === 'validated@example.com') {
        return callback(null, []);
      }

      expect(params[0]).toEqual('duck.t@example.com');

      return callback(null, [ { email: 'duck.t@example.com' } ]);
    }
  });

  const globals = {};
  const stubs = { mysql };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return database error', (done) => {
    script('broken@example.com', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should not update user, if email already validated', (done) => {
    script('validated@example.com', (err, success) => {
      expect(err).toBeFalsy();
      expect(success).toEqual(false);
      done();
    });
  });

  it('should update user', (done) => {
    script('duck.t@example.com', (err, success) => {
      expect(err).toBeFalsy();
      expect(success).toEqual(true);
      done();
    });
  });
});
