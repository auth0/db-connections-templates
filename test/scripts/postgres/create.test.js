'use strict';

const loadScript = require('../../utils/load-script');
const fakePostgres = require('../../utils/fake-db/postgres');

const dbType = 'postgres';
const scriptName = 'create';

describe(scriptName, () => {
  const pg = fakePostgres({
    query: (query, params, callback) => {
      expect(query).toEqual('INSERT INTO users(email, password) VALUES ($1, $2)');
      expect(params.length).toEqual(2);

      if (params[0] === 'broken@example.com') {
        return callback(new Error('test db error'));
      }

      expect(params[0]).toEqual('duck.t@example.com');
      expect(typeof params[1]).toEqual('string');
      expect(params[1].length).toEqual(60);

      return callback(null, { rowCount: 1 });
    }
  });

  const globals = {};
  const stubs = { pg };

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
