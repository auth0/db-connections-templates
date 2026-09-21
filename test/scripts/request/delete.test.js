'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'request';
const scriptName = 'delete';

describe(scriptName, () => {
  const send = jest.fn();
  const axios = { delete: send };

  const globals = { configuration: { baseAPIUrl: 'https://localhost', apiKey: 'test-api-key' } };
  const stubs = { 'axios@0.32.0': axios };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return database error', (done) => {
    send.mockRejectedValue(new Error('test error'));

    script('broken', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test error');
      done();
    });
  });

  it('should remove user', (done) => {
    send.mockImplementation((url) => {
      expect(url).toEqual('https://localhost/users/uid1');
      return Promise.resolve({ data: {} });
    });

    script('uid1', (err) => {
      expect(err).toBeFalsy();
      done();
    });
  });
});
