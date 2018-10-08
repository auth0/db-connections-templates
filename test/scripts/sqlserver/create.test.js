'use strict';

const loadScript = require('../../utils/load-script');
const fakeSqlServer = require('../../utils/fake-db/sqlserver');

const dbType = 'sqlserver';
const scriptName = 'create';

describe(scriptName, () => {
  const sqlserver = fakeSqlServer({
    callback: (query, callback) => {
      expect(query).toContain('INSERT INTO dbo.Users SET Email = ');
      expect(query).toContain(', Password = ');

      if (query.indexOf('broken@example.com') > 0) {
        return callback(new Error('test db error'));
      }

      expect(query).toContain('duck.t@example.com');

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
    script({ email: 'broken@example.com', password: 'password' }, (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should create user', (done) => {
    script({ email: 'duck.t@example.com', password: 'password' }, (err) => {
      expect(err).toBeFalsy();
      done();
    });
  });
});
