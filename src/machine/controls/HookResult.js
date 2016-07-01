/**
 * user handling controller implementation
 * @author kecso / https://github.com/kecso
 */

var model,
    Q = require('q');

function create(data, callback) {
    'use strict';
    var deferred = Q.defer();

    data.created = Date.now();

    model.create(data, function (err, result) {
        if (err) {
            deferred.reject(err);
            return;
        }
        deferred.resolve(result._id);
    });

    return deferred.promise.nodeify(callback);
}
function read(id, callback) {
    'use strict';
    var deferred = Q.defer();

    model.findOne({_id: id})
        .then(function (result) {
            result.__v = undefined;
            deferred.resolve(result);
        })
        .catch(deferred.reject);

    return deferred.promise.nodeify(callback);
}

function remove(id, callback) {
    var deferred = Q.defer();

    model.remove({_id: id})
        .then(defered.resolve)
        .catch(deferred.reject);

    return deferred.promise.nodeify();
}

module.exports = function (mongoose) {
    'use strict';
    model = mongoose.model('HookResult', require('../models/HookResult'));

    return {
        create: create,
        read: read,
        remove: remove
    }
};