'use strict';

const loadScript = require('../../utils/load-script');
const fakeSqlServer = require('../../utils/fake-db/sqlserver');

const dbType = 'MVC4';
const scriptName = 'get_user';

describe(scriptName, () => {
  const user = {
    user_id: 'uid1',
    nickname: 'Terrified Duck',
    name: 'Terrified Duck',
    email: 'duck.t@example.com'
  };

  const sqlserver = fakeSqlServer({
    callback: (query, callback) => {
      expect(query).toContain('SELECT Memberships.UserId, Email, Users.UserName FROM Memberships INNER JOIN Users');

      if (query.indexOf('broken@example.com') > 0) {
        return callback(new Error('test db error'));
      }

      expect(query).toContain('WHERE Memberships.Email = duck.t@example.com OR Users.UserName = duck.t@example.com');

      return callback(null, 1);
    },
    row: (callback) => callback({
      UserId: { value: user.user_id },
      UserName: { value: user.name },
      Email: { value: user.email }
    })
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

  it('should return user data', (done) => {
    script('duck.t@example.com', (err, data) => {
      expect(err).toBeFalsy();
      expect(data).toEqual(user);
      done();
    });
  });
});
