'use strict';

const loadScript = require('../../utils/load-script');
const fakeMongo = require('../../utils/fake-db/mongodb');

const dbType = 'mongo';
const scriptName = 'delete';

describe(scriptName, () => {
  const mongodb = fakeMongo({
    remove: (data, callback) => {
      expect(typeof data).toEqual('object');
      expect(typeof data._id).toEqual('string');

      if (data._id === 'broken') {
        return callback(new Error('test db error'));
      }

      expect(data._id).toEqual('uid1');

      return callback();
    }
  });

  const globals = {};
  const stubs = { mongodb };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return database error', (done) => {
    script('broken', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
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
