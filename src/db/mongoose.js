/**
 * @author kecso / https://github.com/kecso
 */

define([
    'q',
    'mongoose',
    'object-hash',
    './schemas'
], function (Q, mongoose, HASH, models) {
    function dbApi(config) {
        var initDeferred = Q.defer(),
            mainModel = mongoose.model('main', models.main),
            inputModel = mongoose.model('input', models.input),
            resultModel = mongoose.model('constraint', models.result),
            API = {};

        mongoose.connect(config.mongo.uri, config.mongo.options);
        mongoose.connection.on('error', function (err) {
            initDeferred.reject(err);
        });

        mongoose.connection.once('open', function () {
            initDeferred.resolve(API);
        });

        API.ensureMainEntry = function (projectId, commitHash) {
            var deferred = Q.defer();

            mainModel.findOne({commitHash: commitHash})
                .then(function (mainObject) {
                    if (mainObject === null) {
                        return API.reserveEntry(projectId, commitHash);
                    }

                    return mainObject;
                })
                .then(function (mainObject) {
                    deferred.resolve(mainObject);
                })
                .catch(deferred.reject);

            return deferred.promise;
        };

        API.saveInput = function (commitHash, inputs) {
            var deferred = Q.defer(),
                mainObject,
                inputObject,
                hash;

            mainModel.findOne({commitHash: commitHash})
                .then(function (mainObject_) {
                    mainObject = mainObject_;
                    if (mainObject === null) {
                        deferred.reject(new Error('Unknown commit [' + commitHash + ']'));
                        return;
                    }

                    hash = HASH(inputs);

                    return inputModel.findOne({hash: hash});
                })
                .then(function (inputObject_) {
                    if (inputObject_ === null) {
                        return inputModel.create({
                            hash: hash,
                            language: inputs.language,
                            constraints: inputs.constraints,
                            model: inputs.model
                        });

                    }
                    return inputObject_;
                })
                .then(function (createdObject) {
                    inputObject = createdObject;
                    mainObject.input = inputObject.id;
                    return mainObject.save();
                })
                .then(deferred.resolve)
                .catch(deferred.reject);

            return deferred.promise;
        };

        API.saveResults = function (commitHash, results) {
            var deferred = Q.defer(),
                resultObject;

            resultModel.create(results)
                .then(function (newObject) {
                    resultObject = newObject;

                    return mainModel.findOne({commitHash: commitHash});
                })
                .then(function (mainObject) {
                    if (mainObject === null) {
                        throw new Error('Cannot attach result to unknown commit [' + commitHash + ']');
                    }

                    mainObject.constraintResult = resultObject.id;
                    return mainObject.save();
                })
                .then(deferred.resolve)
                .catch(deferred.reject);

            return deferred.promise;
        };

        API.getResult = function (commitHash) {
            var deferred = Q.defer();
            mainModel.findOne({commitHash: commitHash})
                .then(function (mainObject) {
                    if (mainObject === null) {
                        throw  new Error('no such commit object');
                    }

                    if (mainObject.constraintResult === null) {
                        return;
                    }

                    return resultModel.findOne({_id: mainObject.constraintResult});
                })
                .then(function (resultObject) {
                    if (resultObject) {
                        resultObject = resultObject.results;
                    }
                    deferred.resolve(resultObject);
                })
                .catch(function (/*err*/) {
                    deferred.reject(new Error('Unknown Commit [' + commitHash + ']'));
                });

            return deferred.promise;
        };

        API.storeResult = function (commitHash, result) {
            var deferred = Q.defer();

            mainModel.findOne({commitHash: commitHash})
                .then(function (mainObject) {

                })
                .catch(function (/*err*/) {
                    deferred.reject(new Error('Unknown Commit [' + commitHash + ']'));
                });

            return deferred.promise;
        };

        API.reserveEntry = function (projectId, commitHash) {
            var deferred = Q.defer();

            mainModel.create({
                projectId: projectId,
                commitHash: commitHash,
                input: null,
                constraintResult: null
            })
                .then(function (resultObject) {
                    deferred.resolve(resultObject);
                })
                .catch(function (err) {
                    console.log(err);
                    deferred.reject(new Error('Cannot create entry for commit [' + commitHash + ']'));
                });
            return deferred.promise;
        };

        return initDeferred.promise;
    }

    return dbApi;
});