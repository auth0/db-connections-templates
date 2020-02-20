'use strict';

const loadScript = require('../../utils/load-script');

const dbType = '../../test/scripts/sandbox_tests';
const scriptName = 'node';

describe(scriptName, () => {
  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName);
  });

  it('should execute without errors', (done) => {
    script((err) => {
      expect(err).toBeNull();
      done();
    });
  });
});
