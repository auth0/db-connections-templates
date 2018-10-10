'use strict';

const loadScript = require('../../utils/load-script');
const fakeRequest = require('../../utils/fake-db/request');

const dbType = 'request';
const scriptName = 'change_password';

describe(scriptName, () => {
  const request = fakeRequest({
    put: (options, callback) => {
      expect(options.url).toEqual('https://myserviceurl.com/users');
      expect(options.json.password).toEqual('newPassword');

      if (options.json.email === 'broken@example.com') {
        return callback(new Error('test error'));
      }

      if (options.json.email === 'none@example.com') {
        return callback(null, { statusCode: 401 });
      }

      expect(options.json.email).toEqual('duck.t@example.com');

      return callback(null, { statusCode: 200 }, {});
    }
  });

  const globals = {};
  const stubs = { request };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return database error', (done) => {
    script('broken@example.com', 'newPassword', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test error');
      done();
    });
  });

  it('should not throw error on 401', (done) => {
    script('none@example.com', 'newPassword', (err, data) => {
      expect(err).toBeFalsy();
      expect(data).toBeFalsy();
      done();
    });
  });

  it('should update hashed password', (done) => {
    script('duck.t@example.com', 'newPassword', (err, data) => {
      expect(err).toBeFalsy();
      expect(typeof data).toEqual('object');
      done();
    });
  });
});
