'use strict';

const loadScript = require('../../utils/load-script');
const fakeSqlServer = require('../../utils/sqlserver-mock');

const dbType = 'sqlserver';
const scriptName = 'change_password';

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

    script('broken@example.com', 'newPassword', (err) => {
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
    request.mockImplementation((query, callback) => {
      expect(query).toEqual('UPDATE dbo.Users SET Password = @NewPassword WHERE Email = @Email');

      return callback(null, 1);
    });
    addParam
      .mockImplementationOnce((key, type, value) => {
        expect(key).toEqual('NewPassword');
        expect(type).toEqual('varchar');
        expect(value.length).toEqual(60);
      })
      .mockImplementationOnce((key, type, value) => {
        expect(key).toEqual('Email');
        expect(type).toEqual('varchar');
        expect(value).toEqual('duck.t@example.com');
      });

    script('duck.t@example.com', 'newPassword', (err, success) => {
      expect(err).toBeFalsy();
      expect(success).toEqual(true);
      done();
    });
  });
});
