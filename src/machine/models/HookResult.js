/*globals require,module*/
/*jshint node:true*/
/**
 * @author kecso / https://github.com/kecso
 */
'use strict';
var Schema = require('mongoose').Schema,
    HookResultSchema = new Schema({
        created: {type: Date, required: true},
        constraints: Schema.Types.Mixed,
        error: String,
        syntaxError: String
    });

module.exports = HookResultSchema;