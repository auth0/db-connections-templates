'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'request';
const scriptName = 'create';

describe(scriptName, () => {
  const send = jest.fn();
  const axios = { post: send };

  const globals = { configuration: { baseAPIUrl: 'https://localhost', apiKey: 'test-api-key' } };
  const stubs = { 'axios@0.32.0': axios };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return request error', (done) => {
    send.mockRejectedValue(new Error('test error'));

    script({ email: 'broken@example.com', password: 'password' }, (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test error');
      done();
    });
  });

  it('should create user', (done) => {
    send.mockImplementation((url, data) => {
      expect(url).toEqual('https://localhost/users');
      expect(data.email).toEqual('duck.t@example.com');
      expect(data.password).toEqual('password');
      return Promise.resolve({ data: {} });
    });

    script({ email: 'duck.t@example.com', password: 'password' }, (err) => {
      expect(err).toBeFalsy();
      done();
    });
  });
});
