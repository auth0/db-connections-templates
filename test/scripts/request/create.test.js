'use strict';

const loadScript = require('../../utils/load-script');
const fakeRequest = require('../../utils/fake-db/request');

const dbType = 'request';
const scriptName = 'create';

describe(scriptName, () => {
  const request = fakeRequest({
    post: (options, callback) => {
      expect(options.url).toEqual('https://myserviceurl.com/users');
      expect(typeof options.json).toEqual('object');

      if (options.json.email === 'broken@example.com') {
        return callback(new Error('test error'));
      }

      expect(options.json.email).toEqual('duck.t@example.com');
      expect(options.json.password).toEqual('password');

      return callback(null, { statusCode: 200 }, {});
    }
  });

  const globals = {};
  const stubs = { request };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return request error', (done) => {
    script({ email: 'broken@example.com', password: 'password' }, (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test error');
      done();
    });
  });

  it('should create user', (done) => {
    script({ email: 'duck.t@example.com', password: 'password' }, (err) => {
      expect(err).toBeFalsy();
      done();
    });
  });
});
