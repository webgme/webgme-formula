/**
 * Hook handling control implementation
 * @author kecso / https://github.com/kecso
 */

var model,
    Q = require('q');

function create(data) {
    'use strict';
    var deferred = Q.defer();

    data.created = Date.now();

    model.create(data, function (err, result) {
        if (err) {
            deferred.reject(err);
            return;
        }
        // removing the version
        result.__v = undefined; //delete mysteriously not working

        deferred.resolve(result);
    });

    return deferred.promise;
}
function read(id, callback) {
    'use strict';
    var deferred = Q.defer();

    model.findOne({id: id})
        .then(deferred.resolve)
        .catch(deferred.reject);

    return deferred.promise.nodeify(callback);
}

function remove(id, callback) {
    var deferred = Q.defer();

    model.remove({id: id})
        .then(defered.resolve)
        .catch(deferred.reject);

    return deferred.promise.nodeify();
}

function update(id, newData, callback) {
    var deferred = Q.defer();

    model.findOneAndUpdate({id: id}, newData, {new: true}, function (err, newEntry) {
        if (err) {
            deferred.reject(err);
            return;
        }

        deferred.resolve(newEntry);
    });

    return deferred.promise.nodeify(callback);
}

module.exports = function (mongoose) {
    'use strict';
    model = mongoose.model('Hook', require('../models/Hook'));

    return {
        create: create,
        read: read,
        update: update,
        remove: remove
    };
};