/*jshint node: true*/

var config = require('./config.default');

config.bin.log.transports = [{
    transportType: 'File',
    options: {
        name: 'info-file',
        filename: './server.log',
        level: 'info',
        json: false
    }
}, {
    transportType: 'File',
    options: {
        name: 'error-file',
        filename: './server-error.log',
        level: 'error',
        handleExceptions: true,
        json: false
    }
}, {
    transportType: 'Console',
    options: {
        level: 'debug',
        colorize: true,
        timestamp: true,
        prettyPrint: true,
        handleExceptions: true,
        depth: 5
    }
}];

module.exports = config;