/*globals process, console, require*/
'use strict';

var config = require('./config.default'),
    db = process.env.WEBGME_DB_NAME;

if (db) {
    db = '/' + db;
} else {
    db = '/webgme';
}

// Connect to the linked mongo container N.B. container must be named mongo
config.mongo.uri = 'mongodb://' +
    process.env.MONGO_PORT_27017_TCP_ADDR + ':' + process.env.MONGO_PORT_27017_TCP_PORT + db;

module.exports = config;