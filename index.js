const logUpdate = require('log-update');
logUpdate(`⌛︎ initializing`);
require('babel-register');
require('babel-polyfill');
require('./src');
