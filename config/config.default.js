'use strict';

var config = require('./config.webgme'),
    validateConfig = require('webgme/config/validator');

// Add/overwrite any additional settings here
config.server.port = 80;
config.mongo.uri = 'mongodb://127.0.0.1:27017/formula';
// config.mongo.uri = 'mongodb://127.0.0.1:27017/webgme';

//config.requirejsPaths.jsonld = './node_modules/jsonld/js/jsonld';

config.requirejsPaths.src4ml = '';
// config.requirejsPaths.config4ml = './config';

config.plugin.allowServerExecution = true;

config.webhooks.enable = true;

// We do not want to spam the console with bin script logs.
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
}];
validateConfig(config);
module.exports = config;
