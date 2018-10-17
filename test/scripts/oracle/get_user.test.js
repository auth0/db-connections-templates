'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'oracle';
const scriptName = 'get_user';

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
    execute.mockImplementation((query, params, callback) => callback(new Error('test db error')));

    script('broken@example.com', (err) => {
      expect(close).toHaveBeenCalled();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should return user data', (done) => {
    execute.mockImplementation((query, params, callback) => {
      expect(query).toEqual('select ID, EMAIL, NICKNAME from Users where EMAIL = :email');
      expect(params[0]).toEqual('duck.t@example.com');

      const row = {
        ID: 'uid1',
        NICKNAME: 'T-Duck',
        EMAIL: 'duck.t@example.com'
      };

      callback(null, { rows: [ row ] });
    });

    script('duck.t@example.com', (err, user) => {
      const expectedUser = {
        user_id: 'uid1',
        email: 'duck.t@example.com',
        nickname: 'T-Duck'
      };

      expect(close).toHaveBeenCalled();
      expect(err).toBeFalsy();
      expect(user).toEqual(expectedUser);
      done();
    });
  });
});
