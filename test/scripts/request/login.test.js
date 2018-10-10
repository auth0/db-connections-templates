'use strict';

const loadScript = require('../../utils/load-script');
const fakeRequest = require('../../utils/fake-db/request');

const dbType = 'request';
const scriptName = 'login';

describe(scriptName, () => {
  const user = {
    user_id: 'uid1',
    email: 'duck.t@example.com',
    nickname: 'Terrified Duck'
  };
  const request = fakeRequest({
    get: (options, callback) => {
      expect(options.url).toEqual('https://myserviceurl.com/profile');

      if (options.auth.username === 'broken@example.com') {
        return callback(new Error('test error'));
      }

      if (options.auth.username === 'none@example.com') {
        return callback(null, { statusCode: 401 });
      }

      return callback(null, { statusCode: 200 }, JSON.stringify(user));
    }
  });

  const globals = {};
  const stubs = { request };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return database error', (done) => {
    script('broken@example.com', 'password', (err) => {
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

  it('should return user data', (done) => {
    script('duck.t@example.com', 'password', (err, user) => {
      expect(err).toBeFalsy();
      expect(user.email).toEqual('duck.t@example.com');
      expect(user.user_id).toEqual('uid1');
      expect(user.password).toBeFalsy();
      done();
    });
  });
});
