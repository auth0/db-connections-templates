const fs = require('fs');
const async = require('async');

const templates = [
  'change_password',
  'create',
  'delete',
  'get_user',
  'login',
  'verify'
];

const getScript = (type, done) => {
  async.reduce(templates, {}, (scripts, name, cb) => {
    fs.readFile(`./src/scripts/${type}/${name}.js`, 'utf8', (err, text) =>
      cb(err, Object.assign(scripts, { [name]: text})))
  }, done);
};

const processDirs = (dirs, done) => {
  async.reduce(dirs, {}, (result, type, cb) => {
    getScript(type, (err, data) =>
      cb(err, Object.assign(result, { [type]: data})))
  }, done);
}

const buildAll = () => {
  fs.readdir('./src/scripts', (err, dirs) => processDirs(dirs, (err, result) => {
    if (err) return console.error(err);
    fs.appendFile(`./dbscripts.json`, JSON.stringify(result, null, '  '), (e) => console.log(e || 'Completed successfully'));
  }));
};

buildAll();
