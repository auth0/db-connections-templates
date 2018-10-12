'use strict';


const loadScript = require('../../utils/load-script');

const dbType = 'oracle';
const scriptName = 'verify';

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
    execute.mockImplementation((query, params, options,  callback) => callback(new Error('test db error')));

    script('broken@example.com', (err) => {
      expect(close).toHaveBeenCalled();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should not update user, if email already validated', (done) => {
    execute.mockImplementation((query, params, options, callback) => callback(null, { rowsAffected: 0 }));

    script('validated@example.com', (err, success) => {
      expect(close).toHaveBeenCalled();
      expect(err).toBeFalsy();
      expect(success).toEqual(false);
      done();
    });
  });

  it('should update user', (done) => {
    execute.mockImplementation((query, params, options,  callback) => {
      expect(query).toEqual('update Users set EMAIL_VERIFIED = \'true\' where EMAIL = :email and EMAIL_VERIFIED = \'false\'');
      expect(params[0]).toEqual('duck.t@example.com');
      expect(options.autoCommit).toEqual(true);
      callback(null, { rowsAffected: 1 });
    });

    script('duck.t@example.com', (err, success) => {
      expect(close).toHaveBeenCalled();
      expect(err).toBeFalsy();
      expect(success).toEqual(true);
      done();
    });
  });
});
