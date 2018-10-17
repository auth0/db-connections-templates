const fs = require('fs');
const async = require('async');

const getText = (type, cb) => {
  const files = [
    'change_password',
    'create',
    'delete',
    'get_user',
    'login',
    'verify'
  ];

  const results = {};
  async.map(
    files,
    (filename, next) => {
      fs.readFile(`./src/scripts/${type}/${filename}.js`, 'utf8', (err, text) => {
        results[filename] = text;
        next(err);
      });
    },
    () => {
      cb(results);
    });
};

const buildAll = () => {
  fs.mkdir('./dist', () =>
    fs.readdir('./src/scripts', (err, dirs) => {
      async.map(
        dirs,
        (type, next) => {
          getText(type, (data) => {
            const template =
              `module.exports = {
                change_password: (${data.change_password}).toString(),
                create: (${data.create}).toString(),
                delete: (${data.delete}).toString(),
                get_user: (${data.get_user}).toString(),
                login: (${data.login}).toString(),
                verify: (${data.verify}).toString()
              };`;

            fs.appendFile(`./dist/${type}.js`, template, next);
          });
        },
        (err) => {
          if (err) console.log(err);
          let index = 'module.exports = {\n';

          dirs.forEach(type => {
            index += ` ${type}: require('./${type}'),\n`;
          });
          index += '};\n';

          fs.appendFile(`./dist/index.js`, index, (e) => console.log(e || 'Complete'));
        });
    })
  );
};

buildAll();
