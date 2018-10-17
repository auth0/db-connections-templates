'use strict';

const loadScript = require('../../utils/load-script');
const fakeSqlServer = require('../../utils/sqlserver-mock');

const dbType = 'sqlserver';
const scriptName = 'get_user';

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

  it('should return user data', (done) => {
    request.mockImplementation((query, callback) => {
      expect(query).toEqual('SELECT Id, Nickname, Email FROM dbo.Users WHERE Email = @Email');
      callback(null, 1, [ [ { value: 'uid1' }, { value: 'T-Duck' }, { value: 'duck.t@example.com' } ] ]);
    });
    addParam.mockImplementationOnce((key, type, value) => {
      expect(key).toEqual('Email');
      expect(type).toEqual('varchar');
      expect(value).toEqual('duck.t@example.com');
    });

    const expectedUser = {
      user_id: 'uid1',
      nickname: 'T-Duck',
      email: 'duck.t@example.com'
    };

    script('duck.t@example.com', (err, user) => {
      expect(err).toBeFalsy();
      expect(user).toEqual(expectedUser);
      done();
    });
  });
});
