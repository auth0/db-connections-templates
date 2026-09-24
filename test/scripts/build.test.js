'use strict';

const fs = require('fs');
const path = require('path');

const SCRIPT_NAMES = ['change_password', 'create', 'delete', 'get_user', 'login', 'verify'];
const SCRIPTS_DIR = path.join(__dirname, '../../src/scripts');
const DBSCRIPTS_PATH = path.join(__dirname, '../../dbscripts.json');

describe('dbscripts.json', () => {
  it('matches the content of the individual script files', () => {
    const dirs = fs.readdirSync(SCRIPTS_DIR).sort();
    const expected = {};

    dirs.forEach(dir => {
      expected[dir] = {};
      SCRIPT_NAMES.forEach(name => {
        expected[dir][name] = fs.readFileSync(path.join(SCRIPTS_DIR, dir, `${name}.js`), 'utf8');
      });
    });

    const actual = JSON.parse(fs.readFileSync(DBSCRIPTS_PATH, 'utf8'));
    expect(actual).toEqual(expected);
  });
});
