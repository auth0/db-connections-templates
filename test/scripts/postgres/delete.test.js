'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'postgres';
const scriptName = 'delete';

describe(scriptName, () => {
  const query = jest.fn();
  const close = jest.fn();
  const pg = {
    connect: (conString, cb) => {
      expect(conString).toEqual('postgres://user:pass@localhost/mydb');

      cb(null, { query }, close);
    }
  };

  const globals = {};
  const stubs = { pg };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return database error', (done) => {
    query.mockImplementation((query, params, callback) => callback(new Error('test db error')));

    script('broken', (err) => {
      expect(close).toHaveBeenCalled();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should remove user', (done) => {
    query.mockImplementation((query, params, callback) => {
      expect(query).toEqual('DELETE FROM users WHERE id = $1');
      expect(params[0]).toEqual('uid1');
      callback();
    });

    script('uid1', (err) => {
      expect(close).toHaveBeenCalled();
      expect(err).toBeFalsy();
      done();
    });
  });
});
