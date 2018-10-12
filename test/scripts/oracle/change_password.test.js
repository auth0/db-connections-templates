'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'oracle';
const scriptName = 'change_password';

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

    script('broken@example.com', 'newPassword', (err) => {
      expect(close).toHaveBeenCalled();
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
    execute.mockImplementation((query, params, options, callback) => {
      expect(query).toEqual('update Users set PASSWORD = :hash where EMAIL = :email');
      expect(typeof params[0]).toEqual('string');
      expect(params[0].length).toEqual(60);
      expect(params[1]).toEqual('duck.t@example.com');
      expect(options.autoCommit).toEqual(true);
      callback(null, { rowsAffected: 1 });
    });

    script('duck.t@example.com', 'newPassword', (err, success) => {
      expect(close).toHaveBeenCalled();
      expect(err).toBeFalsy();
      expect(success).toEqual(true);
      done();
    });
  });
});
