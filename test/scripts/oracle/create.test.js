'use strict';

const loadScript = require('../../utils/load-script');
const fakeOracle = require('../../utils/fake-db/oracle');

const dbType = 'oracle';
const scriptName = 'create';

describe(scriptName, () => {
  const oracledb = fakeOracle({
    execute: (query, params, callback) => {
      if (query.indexOf('select') === 0) {
        expect(query).toEqual('select ID, EMAIL, PASSWORD, EMAIL_VERIFIED, NICKNAME from Users where EMAIL = :email');
        expect(params.length).toEqual(1);

        if (params[0] === 'broken@example.com') {
          return callback(new Error('test select error'));
        }

        if (params[0] === 'exists@example.com') {
          return callback(null, { rows: [ {} ]});
        }

        return callback(null, { rows: []});
      } else {
        if (params[0] === 'broken2@example.com') {
          return callback(new Error('test insert error'));
        }

        expect(query).toEqual('insert into Users (EMAIL, PASSWORD, EMAIL_VERIFIED, NICKNAME) values (:email, :password, :email_verified, :nickname)');
        expect(params.length).toEqual(4);
        expect(params[0]).toEqual('duck.t@example.com');
        expect(params[1].length).toEqual(60);
        expect(params[2]).toEqual('false');
        expect(params[3]).toEqual('duck.t');
        return callback(null);
      }
    }
  });

  const globals = { configuration: { dbUser: 'dbUser', dbUserPassword: 'dbUserPassword' } };
  const stubs = { oracledb };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return findOne database error', (done) => {
    script({ email: 'broken@example.com' }, (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test select error');
      done();
    });
  });

  it('should return error, if user already exists', (done) => {
    script({ email: 'exists@example.com' }, (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('User already exists');
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
