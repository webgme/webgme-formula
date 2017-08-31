/*globals process, console, require*/
'use strict';

var config = require('./config.default');

config.port = 8001;

// Connect to the linked mongo container N.B. container must be named mongo
config.mongo.uri = 'mongodb://' +
    process.env.MONGO_PORT_27017_TCP_ADDR + ':' + process.env.MONGO_PORT_27017_TCP_PORT + '/4mlMachine';

module.exports = config;