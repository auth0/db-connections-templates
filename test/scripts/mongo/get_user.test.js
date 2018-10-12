'use strict';

const loadScript = require('../../utils/load-script');
const fakeMongo = require('../../utils/fake-db/mongodb');

const dbType = 'mongo';
const scriptName = 'get_user';

describe(scriptName, () => {
  const user = {
    user_id: 'uid1',
    email: 'duck.t@example.com',
    nickname: 'Terrified Duck'
  };

  const mongodb = fakeMongo({
    findOne: (query, callback) => {
      expect(typeof query).toEqual('object');
      expect(typeof query.email).toEqual('string');

      if (query.email === 'broken@example.com') {
        return callback(new Error('test db error'));
      }

      expect(query.email).toEqual('duck.t@example.com');

      return callback(null, { _id: 'uid1', email: 'duck.t@example.com', nickname: 'Terrified Duck' });
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

  it('should return user data', (done) => {
    script('duck.t@example.com', (err, data) => {
      expect(err).toBeFalsy();
      expect(data).toEqual(user);
      done();
    });
  });
});
