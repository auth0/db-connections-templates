'use strict';

const bcrypt = require('bcrypt');

const loadScript = require('../../utils/load-script');
const fakeSqlServer = require('../../utils/sqlserver-mock');

const dbType = 'sqlserver';
const scriptName = 'login';

describe(scriptName, () => {
  const request = jest.fn();
  const addParam = jest.fn();
  const sqlserver = fakeSqlServer(request, addParam);

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
    request.mockImplementation((query, callback) => callback(null, 0, []));

    script('missing@example.com', 'password', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('missing@example.com');
      done();
    });
  });

  it('should return hash error', (done) => {
    request.mockImplementation((query, callback) => callback(null, 1, [[ {}, {}, {}, {} ]]));

    script('empty@example.com', 'password', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('data and hash arguments required');
      done();
    });
  });

  it('should return error, if password is incorrect', (done) => {
    request.mockImplementation((query, callback) => callback(null, 1, [[ {}, {}, {}, { value: 'random-hash' } ]]));

    script('duck.t@example.com', 'wrongPassword', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('duck.t@example.com');
      done();
    });
  });

  it('should return user data', (done) => {
    request.mockImplementation((query, callback) => {
      expect(query).toEqual('SELECT Id, Nickname, Email, Password FROM dbo.Users WHERE Email = @Email');
      callback(null, 1, [[
        { value: 'uid1' },
        { value: 'Terrified Duck' },
        { value: 'duck.t@example.com' },
        { value: bcrypt.hashSync('password', 10) }
      ]]);
    });

    const expectedUser = {
      user_id: 'uid1',
      nickname: 'Terrified Duck',
      email: 'duck.t@example.com'
    };

    script('duck.t@example.com', 'password', (err, user) => {
      expect(err).toBeFalsy();
      expect(user).toEqual(expectedUser);
      done();
    });
  });
});
