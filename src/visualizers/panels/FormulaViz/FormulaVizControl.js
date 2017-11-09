/*globals define, WebGMEGlobal*/
/*jshint browser: true*/
/**
 * Generated by VisualizerGenerator 1.7.0 from webgme on Mon Nov 06 2017 13:29:33 GMT-0600 (CST).
 */

define([
    'js/Constants',
    'js/Utils/GMEConcepts',
    'js/NodePropertyNames',
    'q',
    'common/util/ejs',
    'formulasrc/templates/renderCache'
], function (CONSTANTS,
             GMEConcepts,
             nodePropertyNames,
             Q,
             ejs,
             renderCache) {

    'use strict';

    var FORMULA_ATTR_IN_ROOT = '_formulaConstraints',
        FORMULA_USER_SEGMENT = 'domain_user',
        FORMULA_CHECK_PLUGIN = 'CheckConformance';

    var FormulaVizControl;

    FormulaVizControl = function (options) {
        var self = this;

        this._logger = options.logger.fork('Control');

        this._client = options.client;

        this._docRevision = 0;
        this._segmentedDocument = null;

        this._checkRevision = 0;
        this._autoCheck = false;

        // Initialize core collections and variables
        this._widget = options.widget;

        this._currentNodeId = null;

        this._initWidgetEventHandlers();

        //setting up UI toward the client and the territory
        this._territoryId = this._client.addUI(self, function (events) {
            self._eventCallback(events);
        });
        this._territoryPattern = {};
        this._territoryPattern[CONSTANTS.PROJECT_ROOT_ID] = {children: 0};
        this._client.updateTerritory(this._territoryId, this._territoryPattern);

        this._logger.debug('ctor finished');
    };

    FormulaVizControl.prototype._initWidgetEventHandlers = function () {
        var self = this;
        this._widget.onSave = function (segmentedDocumentObject) {
            self._saveDocument(segmentedDocumentObject);
        };

        this._widget.onClearMarks = function () {
            self._setConsistencyResult();
        }
    };

    FormulaVizControl.prototype._addSegment = function (segmentedDocument, id, content, readOnly) {
        segmentedDocument.composition.push(id);
        segmentedDocument.segments[id] = {
            value: content,
            options: {readonly: readOnly}
        };
    };

    FormulaVizControl.prototype._getEditorContent = function () {
        var self = this,
            deferred = Q.defer(),
            modelNodeId = this._currentNodeId,
            core, root, modelNode, segmentedDocument = {composition: [], segments: {}};
        Q.ninvoke(self._client, 'getCoreInstance', {})
            .then(function (context) {
                core = context.core;
                root = context.rootNode;

                return Q.ninvoke(core, 'loadByPath', root, modelNodeId);
            })
            .then(function (node) {
                var params = {},
                    userPart,
                    modelNode = node;
                params.modelName = core.getAttribute(modelNode, 'name');
                params.metaNodes = core.getAllMetaNodes(modelNode);
                params.core = core;

                self._addSegment(segmentedDocument, 'domain', ejs.render(renderCache.raw.s1, {}), true);
                userPart = core.getAttribute(root, FORMULA_ATTR_IN_ROOT) || '';
                if (userPart.indexOf('\n') === -1) {
                    userPart += '\n';
                }
                self._addSegment(segmentedDocument, FORMULA_USER_SEGMENT, userPart, false);
                self._addSegment(segmentedDocument, 'model_meta', ejs.render(renderCache.raw.s2, params), true);
                return Q.ninvoke(core, 'loadSubTree', modelNode);
            })
            .then(function (nodes) {
                var i,
                    params,
                    modelSegment = '';

                for (i = 0; i < nodes.length; i += 1) {
                    params = {
                        core: core,
                        node: nodes[i]
                    };
                    modelSegment += ejs.render(renderCache.raw.s3, params);
                }
                modelSegment += ejs.render(renderCache.raw.s4, {});

                self._addSegment(segmentedDocument, 'model', modelSegment, true);

                deferred.resolve(segmentedDocument);
            })
            .catch(deferred.reject);

        return deferred.promise;
    };

    FormulaVizControl.prototype._updateDocument = function () {
        var self = this,
            myRevision;

        if (typeof this._currentNodeId !== 'string') {
            return;
        }
        myRevision = ++this._docRevision;
        this._getEditorContent()
            .then(function (segmentedDocument) {
                if (myRevision === self._docRevision) {
                    self._segmentedDocument = segmentedDocument;
                    self._widget.setSegmentedDocument(segmentedDocument);
                }
            })
            .catch(function (err) {
                self._logger.error(err);
            });
    };

    FormulaVizControl.prototype._saveDocument = function (changedSegments) {
        if (typeof changedSegments[FORMULA_USER_SEGMENT] === 'string' &&
            '\n' !== changedSegments[FORMULA_USER_SEGMENT]) {
            this._client.setAttribute(CONSTANTS.PROJECT_ROOT_ID,
                FORMULA_ATTR_IN_ROOT, changedSegments[FORMULA_USER_SEGMENT]);
        }
    };

    FormulaVizControl.prototype._getSingleDoc = function () {
        var doc = '',
            segmented = this._segmentedDocument,
            i;

        if (typeof segmented !== 'object') {
            return doc;
        }

        for (i = 0; i < segmented.composition.length; i += 1) {
            doc += segmented.segments[segmented.composition[i]].value || '';
        }

        return doc;
    };

    FormulaVizControl.prototype._checkConsistency = function () {
        var self = this,
            docRevision = this._docRevision,
            doc = this._getSingleDoc(),
            checkRevision = ++this._checkRevision,
            pluginContext = self._client.getCurrentPluginContext(FORMULA_CHECK_PLUGIN);

        pluginContext.pluginConfig = {'4ml': doc};
        Q.ninvoke(this._client, 'runServerPlugin', FORMULA_CHECK_PLUGIN, pluginContext)
            .then(function (result) {
                if (checkRevision !== self._checkRevision || docRevision !== self._docRevision) {
                    self._logger.info('conformance result arrived late', result);
                    return;
                }

                // now we just need to set the stage
                var errors = JSON.parse(result.messages[0].message || []),
                    conformance = JSON.parse(result.messages[1].message || 'null');
                self._widget.markErrors(errors);
                self._setConsistencyResult(conformance.evaluation);
            })
            .catch(function (err) {
                self._logger.error('Failed conformance check:', err);
            });
    };

    FormulaVizControl.prototype._setConsistencyResult = function (result) {
        var params = {title: '', icon: null};
        if (typeof this._consistencyIndexOnToolbar === 'number') {
            this._toolbarItems[this._consistencyIndexOnToolbar].destroy();
            this._toolbarItems.splice(this._consistencyIndexOnToolbar, 1);
            this._consistencyIndexOnToolbar = null;
        }

        switch (result) {
            case null:
                params.title = 'Consistency check failed. Try again.';
                params.icon = 'glyphicon glyphicon-exclamation-sign conformance-bad'
                break;
            case true:
                params.title = 'The model is well-formed.';
                params.icon = 'glyphicon glyphicon-ok formula-conformance-ok';
                break;
            case false:
                params.title = 'The model is not conforms to the domain rules.';
                params.icon = 'glyphicon glyphicon-remove formula-conformance-bad';
                break;
            default:
                params = null;
        }

        if (params) {
            this._consistencyIndexOnToolbar = this._toolbarItems.length;
            this._toolbarItems.push(WebGMEGlobal.Toolbar.addButton(params));
        }
    };

    /* * * * * * * * Visualizer content update callbacks * * * * * * * */
    // One major concept here is with managing the territory. The territory
    // defines the parts of the project that the visualizer is interested in
    // (this allows the browser to then only load those relevant parts).
    FormulaVizControl.prototype.selectedObjectChanged = function (nodeId) {
        this._currentNodeId = nodeId;
        this._updateDocument();
    };

    /* * * * * * * * Node Event Handling * * * * * * * */
    FormulaVizControl.prototype._eventCallback = function (/*events*/) {
        this._updateDocument();
        if (this._autoCheck) {
            this._checkConsistency();
        }
    };

    FormulaVizControl.prototype._stateActiveObjectChanged = function (model, activeObjectId) {
        if (this._currentNodeId === activeObjectId) {
            // The same node selected as before - do not trigger
        } else {
            this.selectedObjectChanged(activeObjectId);
        }
    };

    /* * * * * * * * Visualizer life cycle callbacks * * * * * * * */
    FormulaVizControl.prototype.destroy = function () {
        this._detachClientEventListeners();
        this._removeToolbarItems();
    };

    FormulaVizControl.prototype._attachClientEventListeners = function () {
        this._detachClientEventListeners();
        WebGMEGlobal.State.on('change:' + CONSTANTS.STATE_ACTIVE_OBJECT, this._stateActiveObjectChanged, this);
    };

    FormulaVizControl.prototype._detachClientEventListeners = function () {
        WebGMEGlobal.State.off('change:' + CONSTANTS.STATE_ACTIVE_OBJECT, this._stateActiveObjectChanged);
    };

    FormulaVizControl.prototype.onActivate = function () {
        this._attachClientEventListeners();
        this._displayToolbarItems();

        if (typeof this._currentNodeId === 'string') {
            WebGMEGlobal.State.registerActiveObject(this._currentNodeId, {suppressVisualizerFromNode: true});
        }
    };

    FormulaVizControl.prototype.onDeactivate = function () {
        this._detachClientEventListeners();
        this._hideToolbarItems();
    };

    /* * * * * * * * * * Updating the toolbar * * * * * * * * * */
    FormulaVizControl.prototype._displayToolbarItems = function () {

        if (this._toolbarInitialized === true) {
            for (var i = this._toolbarItems.length; i--;) {
                this._toolbarItems[i].show();
            }
        } else {
            this._initializeToolbar();
        }
    };

    FormulaVizControl.prototype._hideToolbarItems = function () {

        if (this._toolbarInitialized === true) {
            for (var i = this._toolbarItems.length; i--;) {
                this._toolbarItems[i].hide();
            }
        }
    };

    FormulaVizControl.prototype._removeToolbarItems = function () {

        if (this._toolbarInitialized === true) {
            for (var i = this._toolbarItems.length; i--;) {
                this._toolbarItems[i].destroy();
            }
        }
    };

    FormulaVizControl.prototype._initializeToolbar = function () {
        var self = this,
            toolBar = WebGMEGlobal.Toolbar;

        this._toolbarItems = [];

        this._toolbarItems.push(toolBar.addSeparator());

        this.$btnCheckConsistency = toolBar.addButton({
            title: 'On-demand consistency check',
            icon: 'glyphicon glyphicon-eye-open',
            clickFn: function (/*data*/) {
                self._checkConsistency();
            }
        });
        this._toolbarItems.push(this.$btnCheckConsistency);

        this.$cbAutoCheck = toolBar.addCheckBox({
            title: 'turn auto-check on/off',
            checked: false,
            icon: 'glyphicon glyphicon-tower',
            checkChangedFn: function (data, checked) {
                self._autoCheck = checked;
                if (checked) {
                    self._checkConsistency();
                }
            }
        });
        this._toolbarItems.push(this.$cbAutoCheck);

        this._toolbarInitialized = true;
    };

    return FormulaVizControl;
});
