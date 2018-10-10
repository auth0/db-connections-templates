'use strict';

const loadScript = require('../../utils/load-script');
const fakePostgres = require('../../utils/fake-db/postgres');

const dbType = 'postgres';
const scriptName = 'change_password';

describe(scriptName, () => {
  const pg = fakePostgres({
    query: (query, params, callback) => {
      expect(query).toEqual('UPDATE users SET password = $1 WHERE email = $2');
      expect(params.length).toEqual(2);

      if (params[1] === 'broken@example.com') {
        return callback(new Error('test db error'));
      }

      expect(params[1]).toEqual('duck.t@example.com');
      expect(typeof params[0]).toEqual('string');
      expect(params[0].length).toEqual(60);

      return callback(null, { rowCount: 1 });
    }
  });

  const globals = {};
  const stubs = { pg };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return database error', (done) => {
    script('broken@example.com', 'newPassword', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should return hash error', (done) => {
    script('broken@example.com', null, (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('data and salt arguments required');
      done();
    });
  });

  it('should update hashed password', (done) => {
    script('duck.t@example.com', 'newPassword', (err, success) => {
      expect(err).toBeFalsy();
      expect(success).toEqual(true);
      done();
    });
  });
});
