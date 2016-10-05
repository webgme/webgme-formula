/*jshint node: true*/
/**
 * @author lattmann / https://github.com/lattmann
 * @author pmeijer / https://github.com/pmeijer
 */

var env = process.env.NODE_ENV ? process.env.NODE_ENV : process.platform === 'win32' ? 'win' : 'default',
    configFilename = __dirname + '/config.' + env + '.js',
    config = require(configFilename),
    validateConfig = require('webgme/config/validator');

validateConfig(configFilename);
module.exports = config;