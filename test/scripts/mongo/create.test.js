'use strict';

const loadScript = require('../../utils/load-script');
const fakeMongo = require('../../utils/fake-db/mongodb');

const dbType = 'mongo';
const scriptName = 'create';

describe(scriptName, () => {
  const mongodb = fakeMongo({
    findOne: (query, callback) => {
      expect(typeof query).toEqual('object');
      expect(typeof query.email).toEqual('string');

      if (query.email === 'broken@example.com') {
        return callback(new Error('test findOne error'));
      }

      if (query.email === 'exists@example.com') {
        return callback(null, { email: 'exists@example.com' });
      }

      return callback();
    },
    insert: (data, callback) => {
      expect(typeof data).toEqual('object');
      expect(typeof data.email).toEqual('string');
      expect(typeof data.password).toEqual('string');

      if (data.email === 'broken2@example.com') {
        return callback(new Error('test insert error'));
      }

      expect(data.email).toEqual('duck.t@example.com');

      return callback();
    }
  });

  const globals = {};
  const stubs = { mongodb };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return findOne database error', (done) => {
    script({ email: 'broken@example.com' }, (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test findOne error');
      done();
    });
  });

  it('should return error, if user already exists', (done) => {
    script({ email: 'exists@example.com' }, (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('the user already exists');
      done();
    });
  });

  it('should return hash error', (done) => {
    script({ email: 'broken2@example.com' }, (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('data and salt arguments required');
      done();
    });
  });

  it('should return insert database error', (done) => {
    script({ email: 'broken2@example.com', password: 'password' }, (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test insert error');
      done();
    });
  });

  it('should create user', (done) => {
    script({ email: 'duck.t@example.com', password: 'password' }, (err) => {
      expect(err).toBeFalsy();
      done();
    });
  });
});
