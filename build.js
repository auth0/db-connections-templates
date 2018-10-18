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

const getText = (type, cb) => {
  const results = {};
  async.each(
    templates,
    (name, next) => {
      fs.readFile(`./src/scripts/${type}/${name}.js`, 'utf8', (err, text) => {
        results[name] = text;
        next(err);
      });
    },
    () => {
      cb(results);
    });
};

const buildFileContent = (names, data) => {
  let content = 'module.exports = {\n';

  names.forEach(name => {
    const item = (data) ? data[name] : `require('./${name}')`;
    content += ` ${name}: ` + `${item},\n`;
  });
  content += '};\n';

  return content;
};

const buildAll = () => {
  fs.mkdir('./dist', () =>
    fs.readdir('./src/scripts', (err, dirs) => {
      async.each(
        dirs,
        (type, next) => {
          getText(type, (data) => {
            const content = buildFileContent(templates, data);
            fs.appendFile(`./dist/${type}.js`, content, next);
          });
        },
        (err) => {
          if (err) console.log(err);
          const content = buildFileContent(dirs);
          fs.appendFile(`./dist/index.js`, content, (e) => console.log(e || 'Complete'));
        });
    })
  );
};

buildAll();
