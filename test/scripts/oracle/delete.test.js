'use strict';

const loadScript = require('../../utils/load-script');
const fakeOracle = require('../../utils/fake-db/oracle');

const dbType = 'oracle';
const scriptName = 'delete';

describe(scriptName, () => {
  const oracledb = fakeOracle({
    execute: (query, params, callback) => {
      expect(query).toEqual('delete Users where ID = :id');
      expect(params.length).toEqual(1);

      if (params[0] === 'broken') {
        return callback(new Error('test db error'));
      }

      expect(params[0]).toEqual('uid1');

      return callback(null);
    }
  });

  const globals = { configuration: { dbUser: 'dbUser', dbUserPassword: 'dbUserPassword' } };
  const stubs = { oracledb };

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
