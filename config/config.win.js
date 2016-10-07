'use strict';

var config = require('./config.default'),
    validateConfig = require('webgme/config/validator');

validateConfig(config);
module.exports = config;
