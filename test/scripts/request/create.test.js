'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'request';
const scriptName = 'create';

describe(scriptName, () => {
  const send = jest.fn();
  const request = {
    post: send
  };

  const globals = {};
  const stubs = { request };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return request error', (done) => {
    send.mockImplementation((options, callback) => callback(new Error('test error')));

    script({ email: 'broken@example.com', password: 'password' }, (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test error');
      done();
    });
  });

  it('should create user', (done) => {
    send.mockImplementation((options, callback) => {
      expect(options.url).toEqual('https://localhost/users');
      expect(options.json.email).toEqual('duck.t@example.com');
      expect(options.json.password).toEqual('password');
      callback(null, { statusCode: 200 }, {});
    });

    script({ email: 'duck.t@example.com', password: 'password' }, (err) => {
      expect(err).toBeFalsy();
      done();
    });
  });
});
