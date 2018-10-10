'use strict';

const loadScript = require('../../utils/load-script');
const fakeSqlServer = require('../../utils/fake-db/sqlserver');

const dbType = 'MVC4';
const scriptName = 'change_password';

describe(scriptName, () => {
  const sqlserver = fakeSqlServer({
    callback: (query, callback) => {
      if (query.indexOf('broken@example.com') > 0) {
        return callback(new Error('test db error'));
      }

      if (query.indexOf('SELECT') === 0) {
        expect(query).toContain('SELECT UserProfile.UserId FROM UserProfile INNER JOIN webpages_Membership');
        expect(query).toContain('WHERE UserName=duck.t@example.com');
        callback(null, 1, [ [ { value: 'uid1' } ] ]);
      } else {
        expect(query).toContain('UPDATE webpages_Membership SET Password=');
        expect(query).toContain('WHERE UserId=uid1');
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
    script('broken@example.com', 'newPassword', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
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
