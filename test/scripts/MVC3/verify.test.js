'use strict';

const loadScript = require('../../utils/load-script');
const fakeSqlServer = require('../../utils/sqlserver-mock');

const dbType = 'MVC3';
const scriptName = 'verify';

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

    script('broken@example.com', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should not update user, if email already validated', (done) => {
    request.mockImplementation((query, callback) => callback(null, 0));

    script('validated@example.com', (err, success) => {
      expect(err).toBeFalsy();
      expect(success).toEqual(false);
      done();
    });
  });

  it('should update user', (done) => {
    request.mockImplementation((query, callback) => {
      const expectedQuery =
        'UPDATE Memberships SET isApproved = \'true\' ' +
        'WHERE isApproved = \'false\' AND Email = @Email';
      expect(query).toEqual(expectedQuery);
      callback(null, 1);
    });

    addParam.mockImplementationOnce((key, type, value) => {
      expect(key).toEqual('Email');
      expect(type).toEqual('varchar');
      expect(value).toEqual('duck.t@example.com');
    });

    script('duck.t@example.com', (err, success) => {
      expect(err).toBeFalsy();
      expect(success).toEqual(true);
      done();
    });
  });
});
