'use strict';

const loadScript = require('../../utils/load-script');
const fakeRequest = require('../../utils/fake-db/request');

const dbType = 'request';
const scriptName = 'delete';

describe(scriptName, () => {
  const request = fakeRequest({
    del: (options, callback) => {
      if (options.url.indexOf('/broken') > 0) {
        return callback(new Error('test error'));
      }

      expect(options.url).toEqual('https://myserviceurl.com/users/uid1');

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
    script('broken', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test error');
      done();
    });
  });

  it('should remove user', (done) => {
    script('uid1', (err) => {
      expect(err).toBeFalsy();
      done();
    });
  });
});
