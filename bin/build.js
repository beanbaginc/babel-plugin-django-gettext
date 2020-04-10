var path = require('path'),
    shell = require('shelljs');

shell.config.fatal = true;

console.log('Cleaning...');
shell.rm('-rf', 'lib');

console.log('Transforming to ES5...');
shell.exec(path.normalize('node_modules/.bin/babel') +
           ' --presets env --out-dir lib src');

console.log('Done.');
