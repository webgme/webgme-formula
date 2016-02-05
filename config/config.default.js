'use strict';

var config = require('./config.webgme'),
    validateConfig = require('webgme/config/validator');

// Add/overwrite any additional settings here
config.server.port = 8228;
//config.mongo.uri = 'mongodb://127.0.0.1:27017/webgme_formula';

//config.requirejsPaths.jsonld = './node_modules/jsonld/js/jsonld';

validateConfig(config);
module.exports = config;
