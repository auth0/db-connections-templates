'use strict';

const loadScript = require('../../utils/load-script');
const fakeMysql = require('../../utils/fake-db/mysql');

const dbType = 'mysql';
const scriptName = 'delete';

describe(scriptName, () => {
  const mysql = fakeMysql({
    query: (query, params, callback) => {
      expect(query).toEqual('DELETE FROM users WHERE id = ?');
      expect(typeof params[0]).toEqual('string');

      if (params[0] === 'broken') {
        return callback(new Error('test db error'));
      }

      expect(params[0]).toEqual('uid1');

      return callback();
    }
  });

  const globals = {};
  const stubs = { mysql };

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
