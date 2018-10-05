'use strict';

const loadScript = require('../../utils/load-script');
const fakeMongo = require('../../utils/fake-db/mongodb');

const dbType = 'mongo';
const scriptName = 'verify';

describe(scriptName, () => {
  const mongodb = fakeMongo({
    update: (query, data, callback) => {
      expect(typeof query).toEqual('object');
      expect(typeof data).toEqual('object');
      expect(query.email_verified).toEqual(false);
      expect(data.$set.email_verified).toEqual(true);

      if (query.email === 'broken@example.com') {
        return callback(new Error('test db error'));
      }

      if (query.email === 'validated@example.com') {
        return callback(null, 0);
      }

      expect(query.email).toEqual('duck.t@example.com');

      return callback(null, 1);
    }
  });

  const globals = {};
  const stubs = { mongodb };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return database error', (done) => {
    script('broken@example.com', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should not update user, if email already validated', (done) => {
    script('validated@example.com', (err, success) => {
      expect(err).toBeFalsy();
      expect(success).toEqual(false);
      done();
    });
  });

  it('should update user', (done) => {
    script('duck.t@example.com', (err, success) => {
      expect(err).toBeFalsy();
      expect(success).toEqual(true);
      done();
    });
  });
});
