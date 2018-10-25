'use strict';

const loadScript = require('../../utils/load-script');
const fakeSqlServer = require('../../utils/sqlserver-mock');

const dbType = 'MVC4';
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
    request
      .mockImplementationOnce((query, callback) => {
        const expectedQuery =
          'INSERT INTO UserProfile (UserName) ' +
          'OUTPUT Inserted.UserId ' +
          'VALUES (@UserName)';
        expect(query).toEqual(expectedQuery);
        callback(null, 1, [ [ { value: 'uid1' } ] ]);
      })
      .mockImplementationOnce((query, callback) => {
        const expectedQuery =
          'INSERT INTO webpages_Membership ' +
          '(UserId, CreateDate, IsConfirmed, PasswordFailuresSinceLastSuccess, Password, PasswordSalt) ' +
          'VALUES ' +
          '(@UserId, GETDATE(), \'false\', 0, @Password, \'\')';
        expect(query).toEqual(expectedQuery);
        callback(null, 1);
      });

    addParam
      .mockImplementationOnce((key, type, value) => {
        expect(key).toEqual('UserName');
        expect(type).toEqual('varchar');
        expect(value).toEqual('duck.t@example.com');
      })
      .mockImplementationOnce((key, type, value) => {
        expect(key).toEqual('Password');
        expect(type).toEqual('varchar');
        expect(value.length).toEqual(68);
      })
      .mockImplementationOnce((key, type, value) => {
        expect(key).toEqual('PasswordSalt');
        expect(type).toEqual('varchar');
        expect(value.length).toEqual(24);
      })
      .mockImplementationOnce((key, type, value) => {
        expect(key).toEqual('UserId');
        expect(type).toEqual('varchar');
        expect(value).toEqual('uid1');
      });

    script({ email: 'duck.t@example.com', password: 'password' }, (err, success) => {
      expect(err).toBeFalsy();
      expect(success).toEqual(true);
      done();
    });
  });
});
