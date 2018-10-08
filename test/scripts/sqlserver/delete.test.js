'use strict';

const loadScript = require('../../utils/load-script');
const fakeSqlServer = require('../../utils/fake-db/sqlserver');

const dbType = 'sqlserver';
const scriptName = 'delete';

describe(scriptName, () => {
  const sqlserver = fakeSqlServer({
    callback: (query, callback) => {
      expect(query).toContain('DELETE FROM dbo.Users WHERE id = ');

      if (query.indexOf('broken') > 0) {
        return callback(new Error('test db error'));
      }

      expect(query).toEqual('DELETE FROM dbo.Users WHERE id = uid1');

      return callback();
    }
  });

  const globals = {};
  const stubs = { 'tedious@1.11.0': sqlserver };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return database error', (done) => {
    script('broken', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should remove user', (done) => {
    script('uid1', (err) => {
      expect(err).toBeFalsy();
      done();
    });
  });
});
