'use strict';

const loadScript = require('../../utils/load-script');
const fakeRequest = require('../../utils/fake-db/request');

const dbType = 'request';
const scriptName = 'verify';

describe(scriptName, () => {
  const request = fakeRequest({
    put: (options, callback) => {
      expect(options.url).toEqual('https://myserviceurl.com/users');

      if (options.json.email === 'broken@example.com') {
        return callback(new Error('test error'));
      }

      if (options.json.email === 'none@example.com') {
        return callback(null, { statusCode: 401 });
      }

      expect(options.json.email).toEqual('duck.t@example.com');

      return callback(null, { statusCode: 200 }, { user_id: 'uid1' });
    }
  });

  const globals = {};
  const stubs = { request };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return database error', (done) => {
    script('broken@example.com', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test error');
      done();
    });
  });

  it('should not throw error on 401', (done) => {
    script('none@example.com', (err, data) => {
      expect(err).toBeFalsy();
      expect(data).toBeFalsy();
      done();
    });
  });

  it('should update user', (done) => {
    script('duck.t@example.com', (err, user) => {
      expect(err).toBeFalsy();
      expect(user).toEqual({ user_id: 'uid1' });
      done();
    });
  });
});
