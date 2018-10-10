'use strict';


const loadScript = require('../../utils/load-script');
const fakeOracle = require('../../utils/fake-db/oracle');

const dbType = 'oracle';
const scriptName = 'verify';

describe(scriptName, () => {
  const oracledb = fakeOracle({
    execute: (query, params, callback) => {
      expect(query).toEqual('update Users set EMAIL_VERIFIED = \'true\' where EMAIL = :email');
      expect(params.length).toEqual(1);

      if (params[0] === 'broken@example.com') {
        return callback(new Error('test db error'));
      }

      if (params[0] === 'validated@example.com') {
        return callback(null, { rowsAffected: 0 });
      }

      expect(params[0]).toEqual('duck.t@example.com');

      callback(null, { rowsAffected: 1 });
    }
  });

  const globals = { configuration: { dbUser: 'dbUser', dbUserPassword: 'dbUserPassword' } };
  const stubs = { oracledb };

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
