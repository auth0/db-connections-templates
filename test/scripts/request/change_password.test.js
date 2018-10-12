'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'request';
const scriptName = 'change_password';

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

    script('broken@example.com', 'newPassword', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test error');
      done();
    });
  });

  it('should not throw error on 401', (done) => {
    send.mockImplementation((options, callback) => callback(null, { statusCode: 401 }));

    script('none@example.com', 'newPassword', (err, data) => {
      expect(err).toBeFalsy();
      expect(data).toBeFalsy();
      done();
    });
  });

  it('should update hashed password', (done) => {
    send.mockImplementation((options, callback) => {
      expect(options.url).toEqual('https://myserviceurl.com/users');
      expect(options.json.password).toEqual('newPassword');
      expect(options.json.email).toEqual('duck.t@example.com');
      callback(null, { statusCode: 200 }, {});
    });

    script('duck.t@example.com', 'newPassword', (err, data) => {
      expect(err).toBeFalsy();
      expect(typeof data).toEqual('object');
      done();
    });
  });
});
