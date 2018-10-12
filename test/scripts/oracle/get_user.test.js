'use strict';

const loadScript = require('../../utils/load-script');
const fakeOracle = require('../../utils/fake-db/oracle');

const dbType = 'oracle';
const scriptName = 'get_user';

describe(scriptName, () => {
  const user = {
    user_id: 'uid1',
    email: 'duck.t@example.com',
    nickname: 'T-Duck'
  };

  const oracledb = fakeOracle({
    execute: (query, params, callback) => {
      expect(query).toEqual('select ID, EMAIL, PASSWORD, NICKNAME from Users where EMAIL = :email');
      expect(params.length).toEqual(1);

      if (params[0] === 'broken@example.com') {
        return callback(new Error('test db error'));
      }

      expect(params[0]).toEqual('duck.t@example.com');

      const row = {
        ID: 'uid1',
        NICKNAME: 'T-Duck',
        EMAIL: 'duck.t@example.com'
      };

      return callback(null, { rows: [ row ] });
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

  it('should return user data', (done) => {
    script('duck.t@example.com', (err, data) => {
      expect(err).toBeFalsy();
      expect(data).toEqual(user);
      done();
    });
  });
});
