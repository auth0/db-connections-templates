'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'request';
const scriptName = 'get_user';

describe(scriptName, () => {
  const send = jest.fn();
  const request = {
    get: send
  };

  const globals = {};
  const stubs = { request };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return database error', (done) => {
    send.mockImplementation((options, callback) => callback(new Error('test error')));

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

    send.mockImplementation((options, callback) => {
      expect(options.url).toEqual('https://localhost/users-by-email/duck.t@example.com');
      callback(null, { statusCode: 200 }, JSON.stringify(user));
    });

    script('duck.t@example.com', (err, data) => {
      expect(err).toBeFalsy();
      expect(data).toEqual(user);
      done();
    });
  });
});
