'use strict';

const loadScript = require('../../utils/load-script');
const fakeMongo = require('../../utils/fake-db/mongodb');

const dbType = 'mongo';
const scriptName = 'change_password';

describe(scriptName, () => {
  const mongodb = fakeMongo({
    update: (query, data, callback) => {
      expect(typeof query).toEqual('object');
      expect(typeof data).toEqual('object');

      if (query.email === 'broken@example.com') {
        return callback(new Error('test db error'));
      }

      expect(query.email).toEqual('duck.t@example.com');
      expect(typeof data.$set.password).toEqual('string');

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
    script('broken@example.com', 'newPassword', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should return hash error', (done) => {
    script('broken@example.com', null, (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('data and salt arguments required');
      done();
    });
  });

  it('should update hashed password', (done) => {
    script('duck.t@example.com', 'newPassword', (err, success) => {
      expect(err).toBeFalsy();
      expect(success).toEqual(true);
      done();
    });
  });
});
