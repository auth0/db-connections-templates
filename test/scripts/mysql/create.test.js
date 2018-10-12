'use strict';

const loadScript = require('../../utils/load-script');
const fakeMysql = require('../../utils/fake-db/mysql');

const dbType = 'mysql';
const scriptName = 'create';

describe(scriptName, () => {
  const mysql = fakeMysql({
    query: (query, params, callback) => {
      expect(query).toEqual('INSERT INTO users SET ?');
      expect(typeof params.email).toEqual('string');
      expect(typeof params.password).toEqual('string');

      if (params.email === 'broken@example.com') {
        return callback(new Error('test db error'));
      }

      expect(params.email).toEqual('duck.t@example.com');

      return callback(null, [ { email: params.email } ]);
    }
  });

  const globals = {};
  const stubs = { mysql };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return hash error', (done) => {
    script({ email: 'duck.t@example.com' }, (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('data and salt arguments required');
      done();
    });
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
