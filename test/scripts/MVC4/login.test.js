'use strict';

const loadScript = require('../../utils/load-script');
const fakeSqlServer = require('../../utils/sqlserver-mock');

const dbType = 'MVC4';
const scriptName = 'login';

describe(scriptName, () => {
  const request = jest.fn();
  const addParam = jest.fn();
  const row = jest.fn();
  const sqlserver = fakeSqlServer(request, addParam, row);

  const globals = { WrongUsernameOrPasswordError: Error };
  const stubs = { 'tedious@1.11.0': sqlserver };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return database error', (done) => {
    request.mockImplementation((query, callback) => callback(new Error('test db error')));

    script('broken@example.com', 'password', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should return error, if there is no such user', (done) => {
    request.mockImplementation((query, callback) => callback(null, 0));

    script('missing@example.com', 'password', (err, result) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('missing@example.com');
      expect(result).toBeFalsy();
      done();
    });
  });

  it('should return error, if password is incorrect', (done) => {
    request.mockImplementation((query, callback) => callback(null, 1));

    row.mockImplementation((callback) => callback({
      UserId: { value: '' },
      UserName: { value: '' },
      Password: { value: 'ADvKO2jXFpFIe3Gp5bo4i8g7/NuJQCnNQRjqEzxHBV/b0OTwhkp9vDwO9oQ4FFoeGg==' }
    }));

    script('duck.t@example.com', 'wrongPassword', (err, result) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('duck.t@example.com');
      expect(result).toBeFalsy();
      done();
    });
  });

  it('should return user data', (done) => {
    request.mockImplementation((query, callback) => {
      const expectedQuery =
        'SELECT webpages_Membership.UserId, UserName, UserProfile.UserName, Password from webpages_Membership ' +
        'INNER JOIN UserProfile ON UserProfile.UserId = webpages_Membership.UserId ' +
        'WHERE UserProfile.UserName = @Username';
      expect(query).toEqual(expectedQuery);
      callback(null, 1)
    });

    addParam.mockImplementation((key, type, value) => {
      expect(key).toEqual('Username');
      expect(type).toEqual('varchar');
      expect(value).toEqual('duck.t@example.com');
    });

    row.mockImplementation((callback) => callback({
      UserId: { value: 'uid1' },
      UserName: { value: 'duck.t@example.com' },
      Password: { value: 'password' }
    }));

    const expectedUser = {
      user_id: 'uid1',
      nickname: 'duck.t@example.com',
      email: 'duck.t@example.com'
    };

    script('duck.t@example.com', 'password', (err, user) => {
      expect(err).toBeFalsy();
      expect(user).toEqual(expectedUser);
      done();
    });
  });
});
