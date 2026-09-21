'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'request';
const scriptName = 'login';

describe(scriptName, () => {
  const send = jest.fn();
  const axios = { get: send };

  const globals = { configuration: { baseAPIUrl: 'https://localhost', apiKey: 'test-api-key' } };
  const stubs = { 'axios@0.32.0': axios };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return database error', (done) => {
    send.mockImplementation(() => Promise.reject(new Error('test error')));

    script('broken@example.com', 'password', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test error');
      done();
    });
  });

  it('should not throw error on 401', (done) => {
    send.mockImplementation(() => Promise.reject(Object.assign(new Error('Unauthorized'), { response: { status: 401 } })));

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

    send.mockImplementation((url, config) => {
      expect(url).toEqual('https://localhost/profile');
      expect(config.auth.username).toEqual('duck.t@example.com');
      expect(config.auth.password).toEqual('password');
      return Promise.resolve({ data: user });
    });

    script('duck.t@example.com', 'password', (err, data) => {
      expect(err).toBeFalsy();
      expect(data).toEqual(user);
      done();
    });
  });
});
