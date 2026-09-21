'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'request';
const scriptName = 'get_user';

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

    script('broken@example.com', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test error');
      done();
    });
  });

  it('should return user data', (done) => {
    const user = {
      user_id: 'uid1',
      email: 'duck.t@example.com',
      nickname: 'T-Duck'
    };

    send.mockImplementation((url) => {
      expect(url).toEqual('https://localhost/users-by-email/duck.t@example.com');
      return Promise.resolve({ data: user });
    });

    script('duck.t@example.com', (err, data) => {
      expect(err).toBeFalsy();
      expect(data).toEqual(user);
      done();
    });
  });
});
