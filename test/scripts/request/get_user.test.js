'use strict';

const loadScript = require('../../utils/load-script');
const fakeRequest = require('../../utils/fake-db/request');

const dbType = 'request';
const scriptName = 'get_user';

describe(scriptName, () => {
  const user = {
    user_id: 'uid1',
    email: 'duck.t@example.com',
    nickname: 'Terrified Duck'
  };

  const request = fakeRequest({
    get: (options, callback) => {
      if (options.url.indexOf('broken@example.com') > 0) {
        return callback(new Error('test error'));
      }

      expect(options.url).toEqual('https://myserviceurl.com/users-by-email/duck.t@example.com');

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
    script('broken@example.com', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test error');
      done();
    });
  });

  it('should return user data', (done) => {
    script('duck.t@example.com', (err, data) => {
      expect(err).toBeFalsy();
      expect(data).toEqual(user);
      done();
    });
  });
});
