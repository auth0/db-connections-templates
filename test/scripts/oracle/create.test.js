'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'oracle';
const scriptName = 'create';

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

  it('should return select database error', (done) => {
    execute.mockImplementation((query, params, callback) => callback(new Error('test select error')));

    script({ email: 'broken@example.com' }, (err) => {
      expect(close).toHaveBeenCalled();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test select error');
      done();
    });
  });

  it('should return error, if user already exists', (done) => {
    execute.mockImplementation((query, params, callback) => callback(null, { rows: [ {} ]}));

    script({ email: 'exists@example.com' }, (err) => {
      expect(close).toHaveBeenCalled();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('User already exists');
      done();
    });
  });

  it('should return hash error', (done) => {
    execute.mockImplementation((query, params, callback) => callback(null, { rows: []}));

    script({ email: 'broken@example.com' }, (err) => {
      expect(close).toHaveBeenCalled();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('data and salt arguments required');
      done();
    });
  });

  it('should return insert database error', (done) => {
    execute
      .mockImplementationOnce((query, params, callback) => callback(null, { rows: []}))
      .mockImplementationOnce((query, params, options, callback) => callback(new Error('test insert error')));

    script({ email: 'broken@example.com', password: 'password' }, (err) => {
      expect(close).toHaveBeenCalled();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test insert error');
      done();
    });
  });

  it('should create user', (done) => {
    execute
      .mockImplementationOnce((query, params, callback) => callback(null, { rows: []}))
      .mockImplementationOnce((query, params, options, callback) => {
        expect(query).toEqual('insert into Users (EMAIL, PASSWORD, EMAIL_VERIFIED, NICKNAME) values (:email, :password, :email_verified, :nickname)');
        expect(params.length).toEqual(4);
        expect(params[0]).toEqual('duck.t@example.com');
        expect(params[1].length).toEqual(60);
        expect(params[2]).toEqual('false');
        expect(params[3]).toEqual('duck.t');
        expect(options.autoCommit).toEqual(true);
        callback();
      });

    script({ email: 'duck.t@example.com', password: 'password' }, (err) => {
      expect(close).toHaveBeenCalled();
      expect(err).toBeFalsy();
      done();
    });
  });
});
