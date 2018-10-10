'use strict';

const loadScript = require('../../utils/load-script');
const fakePostgres = require('../../utils/fake-db/postgres');

const dbType = 'postgres';
const scriptName = 'delete';

describe(scriptName, () => {
  const pg = fakePostgres({
    query: (query, params, callback) => {
      expect(query).toEqual('DELETE FROM users WHERE id = $1');
      expect(params.length).toEqual(1);

      if (params[0] === 'broken') {
        return callback(new Error('test db error'));
      }

      expect(params[0]).toEqual('uid1');

      return callback();
    }
  });

  const globals = {};
  const stubs = { pg };

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
