'use strict';

const loadScript = require('../../utils/load-script');
const fakeSqlServer = require('../../utils/fake-db/sqlserver');

const dbType = 'MVC4';
const scriptName = 'verify';

describe(scriptName, () => {
  const sqlserver = fakeSqlServer({
    callback: (query, callback) => {
      if (query.indexOf('broken@example.com') > 0) {
        return callback(new Error('test db error'));
      }

      if (query.indexOf('validated@example.com') > 0) {
        return callback(null, 0);
      }

      if (query.indexOf('SELECT') === 0) {
        expect(query).toContain('SELECT UserProfile.UserId FROM UserProfile INNER JOIN webpages_Membership');
        expect(query).toContain('WHERE UserName = duck.t@example.com');
        callback(null, 1, [ [ { value: 'uid1' } ] ]);
      } else {
        expect(query).toContain('UPDATE webpages_Membership SET isConfirmed = \'true\' ');
        expect(query).toContain('WHERE isConfirmed = \'false\' AND UserId = uid1');
        callback(null, 1);
      }
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
      expect(success).toBeFalsy();
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
