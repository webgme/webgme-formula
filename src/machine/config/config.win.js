/*jshint node: true*/

var config = require('./config.default');

config.environment = '';
config.commands = {
        constraints: '..\\src\\machine\\mono\\Query.exe',
        check: '..\\src\\machine\\mono\\CommandLine.exe'
    };


module.exports = config;
