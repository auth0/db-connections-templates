'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'oracle';
const scriptName = 'delete';

describe(scriptName, () => {
  const execute = jest.fn();
  const close = jest.fn();
  const oracledb = {
    outFormat: '',
    OBJECT: '',
    getConnection: (options, callback) => {
      const expectedOptions = {
        user: 'dbUser',
        password: 'dbUserPassword',
        connectString: 'CONNECTION_STRING'
      };

      expect(options).toEqual(expectedOptions);

      callback(null, { execute, close });
    }
  };

  const globals = { configuration: { dbUser: 'dbUser', dbUserPassword: 'dbUserPassword' } };
  const stubs = { oracledb };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return database error', (done) => {
    execute.mockImplementation((query, params, options, callback) => callback(new Error('test db error')));

    script('broken', (err) => {
      expect(close).toHaveBeenCalled();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should remove user', (done) => {
    execute.mockImplementation((query, params, options, callback) => {
      expect(query).toEqual('delete Users where ID = :id');
      expect(params[0]).toEqual('uid1');
      expect(options.autoCommit).toEqual(true);
      callback();
    });

    script('uid1', (err) => {
      expect(close).toHaveBeenCalled();
      expect(err).toBeFalsy();
      done();
    });
  });
});
