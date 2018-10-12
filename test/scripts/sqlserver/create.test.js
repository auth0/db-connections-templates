'use strict';

const loadScript = require('../../utils/load-script');
const fakeSqlServer = require('../../utils/sqlserver-mock');

const dbType = 'sqlserver';
const scriptName = 'create';

describe(scriptName, () => {
  const request = jest.fn();
  const addParam = jest.fn();
  const sqlserver = fakeSqlServer(request, addParam);

  const globals = {};
  const stubs = { 'tedious@1.11.0': sqlserver };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return database error', (done) => {
    request.mockImplementation((query, callback) => callback(new Error('test db error')));

    script({ email: 'broken@example.com', password: 'password' }, (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should create user', (done) => {
    request.mockImplementation((query, callback) => {
      expect(query).toEqual('INSERT INTO dbo.Users SET Email = @Email, Password = @Password');
      callback(null, 1);
    });
    addParam
      .mockImplementationOnce((key, type, value) => {
        expect(key).toEqual('Email');
        expect(type).toEqual('varchar');
        expect(value).toEqual('duck.t@example.com');
      })
      .mockImplementationOnce((key, type, value) => {
        expect(key).toEqual('Password');
        expect(type).toEqual('varchar');
        expect(value.length).toEqual(60);
      });

    script({ email: 'duck.t@example.com', password: 'password' }, (err) => {
      expect(err).toBeFalsy();
      done();
    });
  });
});
