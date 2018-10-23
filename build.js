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

const getScript = (type, cb) => {
  const results = {};
  async.each(
    templates,
    (name, next) => {
      fs.readFile(`./src/scripts/${type}/${name}.js`, 'utf8', (err, text) => {
        results[name] = text;
        next(err);
      });
    },
    (err) => {
      cb(err, results);
    });
};

const buildAll = () => {
  const result = {};
  fs.readdir('./src/scripts', (err, dirs) => {
    async.each(
      dirs,
      (type, next) =>
        getScript(type, (err, data) => {
          result[type] = data;
          next(err);
        }),
      (err) => {
        if (err) {
          console.log(err);
          return;
        }

        fs.appendFile(`./db-scripts.json`, JSON.stringify(result, null, '  '), (e) => console.log(e || 'Complete'));
      })
  });
};

buildAll();
