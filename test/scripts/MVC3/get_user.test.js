'use strict';

const loadScript = require('../../utils/load-script');
const fakeSqlServer = require('../../utils/sqlserver-mock');

const dbType = 'MVC3';
const scriptName = 'get_user';

describe(scriptName, () => {
  const request = jest.fn();
  const addParam = jest.fn();
  const row = jest.fn();
  const sqlserver = fakeSqlServer(request, addParam, row);

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
      const expectedQuery =
        'SELECT Memberships.UserId, Email, Users.UserName ' +
        'FROM Memberships INNER JOIN Users ' +
        'ON Users.UserId = Memberships.UserId ' +
        'WHERE Memberships.Email = @Username OR Users.UserName = @Username';
      expect(query).toEqual(expectedQuery);
      callback(null, 1);
    });

    addParam.mockImplementation((key, type, value) => {
      expect(key).toEqual('Username');
      expect(type).toEqual('varchar');
      expect(value).toEqual('duck.t@example.com');
    });

    row.mockImplementation((callback) => callback({
      UserId: { value: 'uid1' },
      UserName: { value: 'T-Duck' },
      Email: { value: 'duck.t@example.com' }
    }));

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
