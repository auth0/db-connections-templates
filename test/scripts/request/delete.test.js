'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'request';
const scriptName = 'delete';

describe(scriptName, () => {
  const send = jest.fn();
  const request = {
    del: send
  };

  const globals = {};
  const stubs = { request };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return database error', (done) => {
    send.mockImplementation((options, callback) => callback(new Error('test error')));

    script('broken', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test error');
      done();
    });
  });

  it('should remove user', (done) => {
    send.mockImplementation((options, callback) => {
      expect(options.url).toEqual('https://localhost/users/uid1');
      callback(null, { statusCode: 200 }, {});
    });

    script('uid1', (err) => {
      expect(err).toBeFalsy();
      done();
    });
  });
});
