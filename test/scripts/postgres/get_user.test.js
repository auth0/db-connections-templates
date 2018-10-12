'use strict';

const loadScript = require('../../utils/load-script');
const fakePostgres = require('../../utils/fake-db/postgres');

const dbType = 'postgres';
const scriptName = 'get_user';

describe(scriptName, () => {
  const user = {
    user_id: 'uid1',
    email: 'duck.t@example.com',
    nickname: 'T-Duck'
  };

  const pg = fakePostgres({
    query: (query, params, callback) => {
      expect(query).toEqual('SELECT id, nickname, email FROM users WHERE email = $1');
      expect(params.length).toEqual(1);

      if (params[0] === 'broken@example.com') {
        return callback(new Error('test db error'));
      }

      expect(params[0]).toEqual('duck.t@example.com');

      return callback(null, { rows: [ { id: 'uid1', email: 'duck.t@example.com', nickname: 'T-Duck' } ] });
    }
  });

  const globals = {};
  const stubs = { pg };

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
