'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'mongo';
const scriptName = 'get_user';

describe(scriptName, () => {
  const findOne = jest.fn();
  const mongodb = (conString, callback) => {
    expect(conString).toEqual('mongodb://user:pass@mymongoserver.com/my-db');

    callback({ collection: () => ({ findOne })});
  };

  const globals = {};
  const stubs = { mongodb };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return database error', (done) => {
    findOne.mockImplementation((query, callback) => callback(new Error('test db error')));

    script('broken@example.com', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should return user data', (done) => {
    findOne.mockImplementation((query, callback) => {
      expect(query.email).toEqual('duck.t@example.com');

      return callback(null, { _id: 'uid1', email: 'duck.t@example.com', nickname: 'Terrified Duck' });
    });

    const expectedUser = {
      user_id: 'uid1',
      email: 'duck.t@example.com',
      nickname: 'Terrified Duck'
    };

    script('duck.t@example.com', (err, user) => {
      expect(err).toBeFalsy();
      expect(user).toEqual(expectedUser);
      done();
    });
  });
});
