var path = require('path'),
    shell = require('shelljs'),
    baseInstallPath = 'node_modules/babel-plugin-django-gettext',
    installPath = path.normalize(baseInstallPath),
    jasmineBin = path.normalize('node_modules/.bin/jasmine-node'),
    babelBin = path.normalize('node_modules/.bin/babel'),
    testPath = path.normalize(baseInstallPath + '/test');

shell.config.fatal = true;

console.log('Cleaning...');
shell.rm('-rf', installPath);

console.log('Transforming to ES5...');
shell.mkdir('-p', testPath);
shell.exec(babelBin + ' --presets env --out-dir ' + installPath + ' src');
shell.exec(babelBin + ' --presets env --plugins django-gettext --out-dir ' +
           testPath + ' test');

console.log('Testing...');
shell.exec(jasmineBin + ' --matchall ' + testPath);

console.log('Done.');
