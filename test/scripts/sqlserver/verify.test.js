'use strict';

const loadScript = require('../../utils/load-script');
const fakeSqlServer = require('../../utils/fake-db/sqlserver');

const dbType = 'sqlserver';
const scriptName = 'verify';

describe(scriptName, () => {
  const sqlserver = fakeSqlServer({
    callback: (query, callback) => {
      expect(query).toContain('UPDATE dbo.Users SET Email_Verified = true WHERE Email_Verified = false AND Email = ');

      if (query.indexOf('broken@example.com') > 0) {
        return callback(new Error('test db error'));
      }

      if (query.indexOf('validated@example.com') > 0) {
        return callback(null, 0);
      }

      expect(query).toEqual('UPDATE dbo.Users SET Email_Verified = true WHERE Email_Verified = false AND Email = duck.t@example.com');

      return callback(null, 1);
    }
  });

  const globals = {};
  const stubs = { 'tedious@1.11.0': sqlserver };

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
