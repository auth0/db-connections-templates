'use strict';

const loadScript = require('../../utils/load-script');
const fakeSqlServer = require('../../utils/fake-db/sqlserver');

const dbType = 'MVC4';
const scriptName = 'create';

describe(scriptName, () => {
  const sqlserver = fakeSqlServer({
    callback: (query, callback) => {
      if (query.indexOf('broken@example.com') > 0) {
        return callback(new Error('test db error'));
      }

      if (query.indexOf('INSERT INTO UserProfile') === 0) {
        expect(query).toContain('INSERT INTO UserProfile (UserName) OUTPUT Inserted.UserId VALUES ');
        expect(query).toContain('duck.t@example.com');
        callback(null, 1, [ [ { value: 'uid1' } ] ]);
      } else {
        expect(query).toContain('INSERT INTO webpages_Membership (UserId, CreateDate, IsConfirmed');
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
    script({ email: 'broken@example.com', password: 'password' }, (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should create user', (done) => {
    script({ email: 'duck.t@example.com', password: 'password' }, (err, success) => {
      expect(err).toBeFalsy();
      expect(success).toEqual(true);
      done();
    });
  });
});
