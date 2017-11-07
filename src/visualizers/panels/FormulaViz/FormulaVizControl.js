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
        FORMULA_USER_SEGMENT = 'domain_user';

    function addSegment(segmentedDocument, id, content, readOnly) {
        segmentedDocument.composition.push(id);
        segmentedDocument.segments[id] = {
            value: content,
            options: {readonly: readOnly}
        };
    }

    function getEditorContent(client, modelNodeId) {
        var deferred = Q.defer(),
            core, root, modelNode, segmentedDocument = {composition: [], segments: {}};
        Q.ninvoke(client, 'getCoreInstance', {})
            .then(function (context) {
                core = context.core;
                root = context.rootNode;

                return Q.ninvoke(core, 'loadByPath', root, modelNodeId);
            })
            .then(function (node) {
                var params = {};
                modelNode = node;
                params.modelName = core.getAttribute(modelNode, 'name');
                params.metaNodes = core.getAllMetaNodes(modelNode);
                params.core = core;

                addSegment(segmentedDocument, 'domain', ejs.render(renderCache.raw.s1, {}), true);
                addSegment(segmentedDocument, FORMULA_USER_SEGMENT,
                    core.getAttribute(root, FORMULA_ATTR_IN_ROOT) || '', false);
                addSegment(segmentedDocument, 'model_meta', ejs.render(renderCache.raw.s2, params), true);
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

                addSegment(segmentedDocument, 'model', modelSegment, true);

                deferred.resolve(segmentedDocument);
            })
            .catch(deferred.reject);

        return deferred.promise;
    }

    var FormulaVizControl;

    FormulaVizControl = function (options) {
        var self = this;

        this._logger = options.logger.fork('Control');

        this._client = options.client;

        this._docRevision = 0;

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
    };

    FormulaVizControl.prototype._updateDocument = function () {
        var self = this,
            myrevision;
        if (typeof this._currentNodeId !== 'string') {
            return;
        }
        myrevision = ++this._docRevision;
        getEditorContent(this._client, this._currentNodeId)
            .then(function (segmentedDocument) {
                if (myrevision === self._docRevision) {
                    self._widget.setSegmentedDocument(segmentedDocument);
                }
            })
            .catch(function (err) {
                self._logger.error(err);
            });
    };

    FormulaVizControl.prototype._saveDocument = function (changedSegments) {
        if (typeof changedSegments[FORMULA_USER_SEGMENT] === 'string') {
            this._client.setAttribute(CONSTANTS.PROJECT_ROOT_ID,
                FORMULA_ATTR_IN_ROOT, changedSegments[FORMULA_USER_SEGMENT]);
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

        /************** Go to hierarchical parent button ****************/
        this.$btnModelHierarchyUp = toolBar.addButton({
            title: 'Go to root',
            icon: 'glyphicon glyphicon-circle-arrow-up',
            clickFn: function (/*data*/) {
                WebGMEGlobal.State.registerActiveObject('');
            }
        });
        this._toolbarItems.push(this.$btnModelHierarchyUp);
        this.$btnModelHierarchyUp.hide();

        /************** Checkbox example *******************/

        this.$cbShowConnection = toolBar.addCheckBox({
            title: 'toggle checkbox',
            icon: 'gme icon-gme_diagonal-arrow',
            checkChangedFn: function (data, checked) {
                self._logger.debug('Checkbox has been clicked!');
            }
        });
        this._toolbarItems.push(this.$cbShowConnection);

        this._toolbarInitialized = true;
    };

    return FormulaVizControl;
});
