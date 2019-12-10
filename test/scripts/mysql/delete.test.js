'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'mysql';
const scriptName = 'delete';

describe(scriptName, () => {
  const query = jest.fn();
  const connect = jest.fn();
  const mysql = {
    createConnection: (options) => {
      const expectedOptions = {
        host: 'localhost',
        user: 'me',
        password: 'secret',
        database: 'mydb'
      };
      expect(options).toEqual(expectedOptions);

      return {
        connect,
        query
      };
    }
  };

  const globals = {};
  const stubs = { mysql };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return database error', (done) => {
    query.mockImplementation((query, params, callback) => callback(new Error('test db error')));

    script('broken', (err) => {
      expect(connect).toHaveBeenCalled();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should remove user', (done) => {
    query.mockImplementation((query, params, callback) => {
      expect(query).toEqual('DELETE FROM users WHERE id = ?');
      expect(params[0]).toEqual('uid1');
      callback();
    });

    script('uid1', (err) => {
      expect(connect).toHaveBeenCalled();
      expect(err).toBeFalsy();
      done();
    });
  });
});
