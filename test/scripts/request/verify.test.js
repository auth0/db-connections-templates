'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'request';
const scriptName = 'verify';

describe(scriptName, () => {
  const send = jest.fn();
  const request = {
    put: send
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

  it('should not throw error on 401', (done) => {
    send.mockImplementation((options, callback) => callback(null, { statusCode: 401 }));

    script('none@example.com', (err, data) => {
      expect(err).toBeFalsy();
      expect(data).toBeFalsy();
      done();
    });
  });

  it('should update user', (done) => {
    send.mockImplementation((options, callback) => {
      expect(options.url).toEqual('https://localhost/users');
      expect(options.json.email).toEqual('duck.t@example.com');
      callback(null, { statusCode: 200 }, { user_id: 'uid1' });
    });

    script('duck.t@example.com', (err, user) => {
      expect(err).toBeFalsy();
      expect(user).toEqual({ user_id: 'uid1' });
      done();
    });
  });
});
