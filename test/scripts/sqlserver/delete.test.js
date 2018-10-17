'use strict';

const loadScript = require('../../utils/load-script');
const fakeSqlServer = require('../../utils/sqlserver-mock');

const dbType = 'sqlserver';
const scriptName = 'delete';

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

    script('broken', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should remove user', (done) => {
    request.mockImplementation((query, callback) => {
      expect(query).toEqual('DELETE FROM dbo.Users WHERE id = @UserId');
      callback();
    });
    addParam.mockImplementation((key, type, value) => {
      expect(key).toEqual('UserId');
      expect(type).toEqual('varchar');
      expect(value).toEqual('uid1');
    });

    script('uid1', (err) => {
      expect(err).toBeFalsy();
      done();
    });
  });
});
