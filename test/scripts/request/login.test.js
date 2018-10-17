'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'request';
const scriptName = 'login';

describe(scriptName, () => {
  const send = jest.fn();
  const request = {
    get: send
  };

  const globals = {};
  const stubs = { request };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return database error', (done) => {
    send.mockImplementation((options, callback) => callback(new Error('test error')));

    script('broken@example.com', 'password', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test error');
      done();
    });
  });

  it('should not throw error on 401', (done) => {
    send.mockImplementation((options, callback) => callback(null, { statusCode: 401 }));

    script('none@example.com', 'newPassword', (err, data) => {
      expect(err).toBeFalsy();
      expect(data).toBeFalsy();
      done();
    });
  });

  it('should return user data', (done) => {
    const user = {
      user_id: 'uid1',
      email: 'duck.t@example.com',
      nickname: 'Terrified Duck'
    };

    send.mockImplementation((options, callback) => {
      expect(options.url).toEqual('https://myserviceurl.com/profile');
      expect(options.auth.username).toEqual('duck.t@example.com');
      expect(options.auth.password).toEqual('password');
      callback(null, { statusCode: 200 }, JSON.stringify(user));
    });

    script('duck.t@example.com', 'password', (err, data) => {
      expect(err).toBeFalsy();
      expect(data).toEqual(user);
      done();
    });
  });
});
