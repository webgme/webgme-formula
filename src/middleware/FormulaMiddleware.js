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
        checkAccess(authorizer, req.userData.userId, req.params.projectId)
            .then(function () {
                superagent.get('http://localhost:9009/4ml/' + encodeURIComponent(req.params.projectId) + '/' +
                    encodeURIComponent(req.params.commitHash))
                    .end(function (err, result) {
                        if (err) {
                            res.status(500);
                            res.send(err);
                            return;
                        }
                        res.send(JSON.parse(result.text));
                    });
            })
            .catch(function (err) {
                res.status(403);
                res.send(err);
            });

    });

    router.get('/getExample', function (req, res/*, next*/) {
        var userId = getUserId(req);

        res.json({userId: userId, message: 'get request was handled'});
    });

    router.patch('/patchExample', function (req, res/*, next*/) {
        res.sendStatus(200);
    });

    router.post('/postExample', function (req, res/*, next*/) {
        res.sendStatus(201);
    });

    router.delete('/deleteExample', function (req, res/*, next*/) {
        res.sendStatus(204);
    });

    router.get('/error', function (req, res, next) {
        next(new Error('error example'));
    });

    logger.debug('ready');
}

module.exports = {
    initialize: initialize,
    router: router
};