/*jshint node:true*/
/**
 * @author kecso / https://github.com/kecso
 */

'use strict';

var express = require('express'),
    router = express.Router(),
    superagent = require('superagent'),
    StorageUtil = requireJS('common/storage/util'),
    Q = requireJS('q');

function checkAccess(authorizer, userId, projectId) {
    var deferred = Q.defer(),
        projectAuthParams = {
            entityType: authorizer.ENTITY_TYPES.PROJECT
        };

    authorizer.getAccessRights(userId, projectId, projectAuthParams)
        .then(function (projectAccess) {
            if (projectAccess && projectAccess.read) {
                deferred.resolve();
            } else {
                throw new Error('Not authorized to use FormulaMiddleware!');
            }
        })
        .catch(deferred.reject);

    return deferred.promise;
}

function initialize(middlewareOpts) {
    var logger = middlewareOpts.logger.fork('FormulaMiddleware'),
    //gmeConfig = middlewareOpts.gmeConfig,
        ensureAuthenticated = middlewareOpts.ensureAuthenticated,
        getUserId = middlewareOpts.getUserId,
        authorizer = middlewareOpts.gmeAuth.authorizer;

    logger.debug('initializing ...');

    // ensure authenticated can be used only after this rule
    router.use('*', function (req, res, next) {
        // TODO: set all headers, check rate limit, etc.
        res.setHeader('X-WebGME-Media-Type', 'webgme.v1');
        next();
    });

    // all endpoints require authentication
    router.use('*', ensureAuthenticated);

    // all endpoints require read access to the given project
    router.get('/:projectId/:commitHash', function (req, res) {
        superagent.get('http://127.0.0.1:' + middlewareOpts.gmeConfig.server.port + '/api/componentSettings/FormulaEditor')
            .end(function (err, result) {
                var config = result ? JSON.parse(result.text || '{}') : {};

                config.baseUrl = config.baseUrl || 'http://127.0.0.1:9009/4ml';
                checkAccess(authorizer, req.userData.userId, req.params.projectId)
                    .then(function () {
                        superagent.get(config.baseUrl + '/' + encodeURIComponent(req.params.projectId) + '/' +
                            encodeURIComponent(req.params.commitHash))
                            .end(function (err, result) {
                                if (err) {
                                    if (err.message.indexOf('Not found') !== -1) {
                                        res.status(404);
                                    } else {
                                        logger.error('Error during result query:', err);
                                        res.status(500);
                                    }
                                    res.send(err);
                                    return;
                                }
                                res.send(JSON.parse(result.text));
                            });
                    })
                    .catch(function (err) {
                        logger.info('User doesn\'t have necessary rights to access results.', err);
                        res.status(403);
                        res.send(err);
                    });
            });

    });
}

/**
 * Called before the server starts listening.
 * @param {function} callback
 */
function start(callback) {
    callback();
}

/**
 * Called after the server stopped listening.
 * @param {function} callback
 */
function stop(callback) {
    callback();
}


module.exports = {
    initialize: initialize,
    router: router,
    start: start,
    stop: stop
};