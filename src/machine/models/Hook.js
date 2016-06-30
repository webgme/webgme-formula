/*globals require,module*/
/*jshint node:true*/
/**
 * @author kecso / https://github.com/kecso
 */
'use strict';
var Schema = require('mongoose').Schema,
    HookSchema = new Schema({
        id: {
            type: String,
            required: true,
            index: true,
            validate: {
                validator: function (v) {
                    //TODO we could add validation for the composed id here
                    return true;
                }
            }
        },
        owner: {type: String, required: true},
        projectId: {type: String, required: true},
        projectName: {type: String, required: true},
        commitHash: {type: String, required: true},
        data: {type: Schema.Types.Mixed, requireed: true},
        result: {type: Schema.Types.ObjectId, ref: 'HookResult'},
        created: {type: Date, required: true}
    });

module.exports = HookSchema;