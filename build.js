require('log-update')('⌛︎ initializing');
require('babel-register');
require('babel-polyfill');
require('./build/index.js'); // need to explicit here because './build' is ambiguous
