'use strict';

const loadScript = require('../../utils/load-script');
const fakeMysql = require('../../utils/fake-db/mysql');

const dbType = 'mysql';
const scriptName = 'get_user';

describe(scriptName, () => {
  const user = {
    id: 'uid1',
    email: 'duck.t@example.com',
    name: 'Terrified Duck'
  };

  const mysql = fakeMysql({
    query: (query, params, callback) => {
      expect(query).toEqual('SELECT * FROM users WHERE email = ?');
      expect(typeof params[0]).toEqual('string');

      if (params[0] === 'broken@example.com') {
        return callback(new Error('test db error'));
      }

      expect(params[0]).toEqual('duck.t@example.com');

      return callback(null, [ user ]);
    }
  });

  const globals = {};
  const stubs = { mysql };

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
