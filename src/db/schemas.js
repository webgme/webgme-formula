/*globals require,module*/
/*jshint node:true*/
/**
 * @author kecso / https://github.com/kecso
 */
define([
    'mongoose'
], function (mongoose) {
    'use strict';
    var Schema = mongoose.Schema,
        mainSchema = new Schema({
            projectId: {type: String, required: true},
            commitHash: {type: String, required: true, index: true, unique: true},
            input: {type: Schema.Types.ObjectId, ref: 'input'},
            constraintResult: {type: Schema.Types.ObjectId, ref: 'constraint'}
        }),
        inputSchema = new Schema({
            hash: {type: String, required: true},
            language: {type: String, required: true},
            constraints: {type: String, required: true},
            model: {type: String, required: true}
        }),
        constraintSchema = new Schema({name: String, evaluation: String}),
        constraintResultSchema = new Schema({
            results: [constraintSchema]
        });

    return {
        main: mainSchema,
        input: inputSchema,
        result: constraintResultSchema
    };
});
