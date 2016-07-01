/**
 * @author kecso / https://github.com/kecso
 */

function executeHook(eventData) {
    var deferred = Q.defer(),
        directory,
        result;

    console.time('plugin');
    generate4ml(eventData)
        .then(function (formulaData) {
            console.timeEnd('plugin');
            console.time('pre');
            return prepareFormula(eventData.id, formulaData);
        })
        .then(function (directory_) {
            directory = directory_;
            console.timeEnd('pre');
            console.time('4ml');
            return executeFormulaTasks(directory);
        })
        .then(function (result_) {
            result = result_;
            console.timeEnd('4ml');
            console.time('post');
            return cleanFormula(directory);
        })
        .then(function () {
            console.timeEnd('post');
            return storeHookResult(eventData.id, result);
        })
        .then(deferred.resolve)
        .catch(deferred.reject);

    return deferred.promise;
}

function generate4ml(parameters) {
    var deferred = Q.defer();

    runPlugin.main(['_', '_', 'GenFORMULA', parameters.projectName,
            '-c', parameters.commitHash, '-o', parameters.owner, '-u', parameters.data.userId],
        function (err, result) {
            if (err) {
                deferred.reject(err);
                return;
            }
            if (result.success && result.messages.length === 2) {
                deferred.resolve({
                    project: result.messages[0].message,
                    constraints: result.messages[1].message
                });
            }
        }
    );
    return deferred.promise;
}

function prepareFormula(id, formulaData) {
    var deferred = Q.defer(),
        fileCounter = 2,
        directory = './' + id,
        error = null,
        allDone = function () {
            if (error) {
                deferred.reject(error);
                return;
            }
            deferred.resolve(directory);
        };

    FS.mkdir(directory, function (err) {
        if (err) {
            deferred.reject(err);
            return;
        }

        FS.writeFile(PATH.join(directory, '/module.4ml'), formulaData.project, function (err) {
            error = error || err;
            if (--fileCounter === 0) {
                allDone();
            }
        });

        //file for constraints
        FS.writeFile(PATH.join(directory, '/constraints.json'), formulaData.constraints, function (err) {
            error = error || err;
            if (--fileCounter === 0) {
                allDone();
            }
        });
    });

    return deferred.promise;
}

function cleanFormula(directory) {
    var deferred = Q.defer();

    FS.readdir(directory, function (err, files) {
        var i;

        if (err) {
            deferred.reject(err);
            return;
        }

        for (i = 0; i < files.length; i += 1) {
            FS.unlinkSync(PATH.join(directory, files[i]));
        }
        FS.rmdir(directory, function (err) {
            if (err) {
                deferred.reject(err);
                return;
            }

            deferred.resolve();
        });
    });

    return deferred.promise;
}

function executeFormulaTasks(directory) {
    var deferred = Q.defer();

    //all the different Formula tasks can be executed independently
    Q.allSettled([
        executeConstraints(directory)
    ])
        .then(function (results) {
            var output = {};

            // Constraint results
            if (results[0].state === 'rejected') {
                logger.error('cannot get constraint results:', results[0].reason);
                deferred.reject(new Error('failed to check constraints'));
                return;
            }
            output.constraints = results[0].value;

            deferred.resolve(output);
        });
    return deferred.promise;
}

function executeConstraints(directory) {
    var deferred = Q.defer(),
        result;
    EXECUTE(config.environment + ' ' +
        config.commands.constraints + ' -f module.4ml -c constraints.json',
        {
            cwd: directory
        },
        function (err) {
            if (err) {
                deferred.reject(err);
                return;
            }
            FS.readFile(PATH.join(directory, 'queryresults.json'), function (err, resultAsString) {
                if (err) {
                    deferred.reject(err);
                    return;
                }

                try {
                    result = JSON.parse(resultAsString);
                    for (var i in result) {
                        result[i] = result[i] === 'true';
                    }
                } catch (err) {
                    deferred.reject(err);
                    return;
                }

                deferred.resolve(result);
            });
        }
    );

    return deferred.promise;
}

function getIdFromHook(hook) {
    return hook.owner + '_' + hook.projectName + '_' + hook.commitHash.substr(1);
}

function getIdFromGetRequest(projectId, commitHash) {
    return projectId.replace("+", "_") + '_' + commitHash.substr(1);
}

function storeCommitEvent(eventData) {
    var deferred = Q.defer();

    eventData.commitHash = eventData.data.commitHash;
    eventData.id = getIdFromHook(eventData);
    hooks.create(eventData)
        .then(deferred.resolve)
        .catch(deferred.reject);

    return deferred.promise;
}

function storeHookResult(id, result) {
    var deferred = Q.defer();

    hookResults.create(result)
        .then(function (resultId) {
            return hooks.update(id, {result: resultId});
        })
        .then(function (/*newHookEntry*/) {
            deferred.resolve();
        })
        .catch(deferred.reject);

    return deferred.promise;
}

var Express = require('express'),
    webgme = require('webgme'), //necessary to get a proper requireJS onto the global scope
    bodyParser = require('body-parser'),
    FS = require('fs'),
    PATH = require('path'),
    EXECUTE = require('child_process').exec,
    Logger = require('./logger'),
    config = require('./config'),
    runPlugin = require('webgme/src/bin/run_plugin'),
    Q = require('q'),
    logger = Logger.create('FormulaMachine', config.log),
    __router = new Express(),
    __httpServer,
    mongoose = require('mongoose'),
    hooks,
    hookResults;

__router.use(bodyParser.json({limit: '900mb'}));

// This route should be used to trigger hook handling
__router.post('/4ml', function (req, res) {
    if (req && req.body && req.body.hookId === config.hookId) {
        console.time('hook');
        storeCommitEvent(req.body)
            .then(function (newHookEntry) {
                res.sendStatus(200);
                return executeHook(newHookEntry);
            })
            .then(function () {
                //TODO do we need any postprocessing??
                console.timeEnd('hook');
            })
            .catch(function (err) {
                console.timeEnd('hook');
                logger.error(err);
                res.status(500);
                res.send(err);
            });
    } else {
        logger.info('unknown POST event');
        res.sendStatus(400);
    }
});

// This is for re-execution of a specific hook
__router.put('/4ml', function (req, res) {
    if (req && req.body) {
        reExecuteHook(req.body)
            .then(function () {

            })
            .catch(function (err) {
                res.status(500);
            })
        storeCommitEvent(req.body)
            .then(function () {
                res.sendStatus(200);
                return executeHook(req.body);
            })
            .then(function () {
                //TODO do we need any postprocessing??
            })
            .catch(function (err) {
                res.status(500);
                res.send(err);
            });
    } else {
        logger.info('unknown POST event');
        res.sendStatus(400);
    }
});

// This is to get specific data from a hook-result
__router.get('/4ml/:projectId/:commitHash', function (req, res) {
    var id = getIdFromGetRequest(req.params.projectId, req.params.commitHash);

    hooks.read(id)
        .then(function (hookEntry) {
            console.log('READ:', hookEntry);
            res.send(hookEntry);
        })
        .catch(function (err) {
            logger.error('Get request failed:', err);
            res.status(500);
            res.send(err);
        });
});

__httpServer = require('http').createServer(__router);

__httpServer.on('connection', function (socket) {
    logger.info('new connection', socket.id);
});

__httpServer.on('clientError', function (err, socket) {
    logger.error('clientError [' + socket.id + ']', err);
});

__httpServer.on('error', function (err) {
    logger.error('serverError', err);
});

__httpServer.listen(config.port, function (err) {
    if (err) {
        logger.error('Error during startup', err);
        process.exit(1);
    }

    mongoose.connect(config.mongo.uri, config.mongo.options);
    mongoose.connection.on('error', function (err) {
        logger.error('MongoDB connection failure', err);
        proces.exit(1);
    });

    mongoose.connection.once('open', function () {
        logger.info('connected to mongoDB');
    });

    hooks = require('./controls/Hook')(mongoose);
    hookResults = require('./controls/HookResult')(mongoose);

    process.chdir('../../');

});