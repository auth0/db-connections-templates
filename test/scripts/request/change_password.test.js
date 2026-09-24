'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'request';
const scriptName = 'change_password';

describe(scriptName, () => {
  const send = jest.fn();
  const axios = { put: send };

  const globals = { configuration: { baseAPIUrl: 'https://localhost', apiKey: 'test-api-key' } };
  const stubs = { 'axios@0.32.0': axios };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return database error', (done) => {
    send.mockImplementation(() => Promise.reject(new Error('test error')));

    script('broken@example.com', 'newPassword', (err) => {
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

  it('should update hashed password', (done) => {
    send.mockImplementation((url, data) => {
      expect(url).toEqual('https://localhost/users');
      expect(data.password).toEqual('newPassword');
      expect(data.email).toEqual('duck.t@example.com');
      return Promise.resolve({ data: {} });
    });

    script('duck.t@example.com', 'newPassword', (err, data) => {
      expect(err).toBeFalsy();
      expect(typeof data).toEqual('object');
      done();
    });
  });
});
