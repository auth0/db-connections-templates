'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'mongo';
const scriptName = 'delete';

describe(scriptName, () => {
  const remove = jest.fn();
  const mongodb = (conString, callback) => {
    expect(conString).toEqual('mongodb://user:pass@mymongoserver.com/my-db');

    callback({ collection: () => ({ remove })});
  };

  const globals = {};
  const stubs = { mongodb };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return database error', (done) => {
    remove.mockImplementation((query, callback) => callback(new Error('test db error')));

    script('broken', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should remove user', (done) => {
    remove.mockImplementation((query, callback) => {
      expect(query._id).toEqual('uid1');

      callback();
    });

    script('uid1', (err) => {
      expect(err).toBeFalsy();
      done();
    });
  });
});
