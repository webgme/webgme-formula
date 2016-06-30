'use strict';

var config = require('./config.webgme'),
    validateConfig = require('webgme/config/validator');

// Add/overwrite any additional settings here
config.server.port = 8228;
config.mongo.uri = 'mongodb://127.0.0.1:27017/formula';

//config.requirejsPaths.jsonld = './node_modules/jsonld/js/jsonld';

config.plugin.allowServerExecution = true;

config.rest.components['4ml'] = '../../../../src/middleware/FormulaMiddleware.js';

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
