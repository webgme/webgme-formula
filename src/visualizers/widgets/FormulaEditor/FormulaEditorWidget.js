/*globals define, WebGMEGlobal*/
/*jshint browser: true*/

/**
 * Generated by VisualizerGenerator 1.7.0 from webgme on Fri May 13 2016 16:30:58 GMT-0500 (CDT).
 */

define([
    './FormulaCodeMirrorMode',
    'js/Loader/LoaderCircles'
], function (CodeMirror, LoaderCircles) {
    'use strict';

    var FormulaEditorWidget,
        WIDGET_CLASS = 'formula-editor';

    // TODO check if regular expression is correct and if it is fine here - no other users
    function getConstraintNamesFromText(txt) {
        var regExp = /\w+(?= *:-.*\.)/g,
            result = txt.match(regExp);

        return result || [];
    }

    FormulaEditorWidget = function (logger, container) {
        this._logger = logger.fork('Widget');

        this._el = container;
        this._editorEl = null;
        this._codeMirrorEl = null;
        this._listEl = null;
        this._initialize();

        this._logger.debug('ctor finished');
    };

    FormulaEditorWidget.prototype._initialize = function () {
        var width = this._el.width(),
            height = this._el.height(),
            self = this;

        // set widget class
        this._el.addClass(WIDGET_CLASS);

        $(this._el).css({
            'padding': '0'
        });

        // Create a dummy header 
        // this._el.append('<h3>FormulaEditor</h3>');
        // this.setTitle('FormulaEditor');

        this._editorEl = $('<div class="col-sm-9">');
        this._codeMirrorEl = $('<textarea>');
        this._saveConstraintsBtn = $('<button type="button" class="btn btn-default">Save</button>');

        this._saveConstraintsBtn.on('click', function (/*event*/) {
            self._previousCodeState = self._codemirror.getValue();
            self.onSaveConstraints(self._previousCodeState);
            self._saveConstraintsBtn.attr('disabled', true);
            self.setResults({}); // constraints probably changed so we clear the results
        });

        this._editorEl.append(this._codeMirrorEl);
        this._editorEl.append(this._saveConstraintsBtn);
        this._el.append(this._editorEl);

        this._codeMirrorEl.focus();
        this._codemirror = CodeMirror.fromTextArea(this._codeMirrorEl[0], {
            lineNumbers: true,
            theme: 'monokai',
            matchBrackets: true,
            mode: {
                name: 'formula',
                globalVars: true
            },
            dragDrop: true,
            inputStyle: 'textarea'
        });

        this._codemirror.on('change', function () {
            // If the content is changed from the last saved one we allow the save button.
            // Otherwise it will be disabled
            if (self._previousCodeState !== self._codemirror.getValue()) {
                self._saveConstraintsBtn.attr('disabled', false);
            } else {
                self._saveConstraintsBtn.attr('disabled', true);
            }
        });

        this._codemirror.on('drop', function (cm, event) {
            console.log('dropping', event);
        });

        this._codemirror.on('update', function (cm) {
            console.log('update', cm);
        });

        this._codemirror.on('focus', function (cm) {
            console.log('focused', cm.getValue());
        });

        this._autoSaveInterval = 10000; //1s autoSave - if change happened
        this._autoSaveTimer = null;
        this._previousCodeState = null;

        this._listEl = $('<div class="col-sm-2">');

        this._constraintList = $('<ul class="list-group"><li class="list-group-item">Item' +
            '<span class="badge"><span class="glyphicon glyphicon-ok-sign"/></span></li></ul>');
        this._checkContraintsBtn = $('<button type="button" ' +
            'class="btn btn-default">Check constraints</button>');

        this._checkContraintsBtn.on('click', function (event) {
            self.onCheckConstraints(getConstraintNamesFromText(self._codemirror.getValue()));
        });
        self._saveConstraintsBtn.attr('disabled', true);

        this._listEl.append(this._constraintList);
        this._listEl.append(this._checkContraintsBtn);

        this._el.append(this._listEl);

        this._codemirror.refresh();

        this._loader = new LoaderCircles({containerElement: this._listEl});
    };

    FormulaEditorWidget.prototype.onWidgetContainerResize = function (width, height) {
        this._logger.debug('Widget is resizing...');
    };

    // Auto-save functions

    FormulaEditorWidget.prototype._autoSave = function () {
        if (this._previousCodeState !== this._codemirror.getValue()) {
            this._previousCodeState = this._codemirror.getValue();
            this.onSaveConstraints(this._previousCodeState);
            this._saveConstraintsBtn.attr('disabled', true);
            this.setResults({}); //something changed, we clear results
        }
    };

    FormulaEditorWidget.prototype._startAutoSave = function () {
        var self = this;
        if (this._autoSaveTimer) {
            clearInterval(this._autoSaveTimer);
            this._autoSaveTimer = null;
        }

        this._autoSaveTimer = setInterval(function () {
            self._autoSave.call(self);
        }, this._autoSaveInterval);
    };
    FormulaEditorWidget.prototype._stopAutoSave = function () {
        if (this._autoSaveTimer) {
            clearInterval(this._autoSaveTimer);
            this._autoSaveTimer = null;
        }
    };

    FormulaEditorWidget.prototype.getConstraints = function () {
        return this._codemirror.getValue();
    };

    FormulaEditorWidget.prototype.setConstraints = function (text) {
        // setting code from outside so the auto-save should not be triggered
        this._previousCodeState = text;
        if (text !== this._codemirror.getValue()) {
            // this._codemirror.setValue(text);
            this._codemirror.swapDoc(new CodeMirror.Doc(text));
            this._codemirror.refresh();
            console.log(this._codemirror.hasFocus());
            this._codemirror.focus();
            console.log(this._codemirror.hasFocus());
            this.setResults({}); //something is changed so we clear the results, just to be on the safe side
        }
    };

    FormulaEditorWidget.prototype.setResults = function (resultObject) {
        var constraints = getConstraintNamesFromText(this._codemirror.getValue()).sort(),
            i;
        this._loader.stop();
        this._constraintList.empty();
        for (i = 0; i < constraints.length; i += 1) {
            if (typeof resultObject[constraints[i]] === 'boolean') {
                if (resultObject[constraints[i]]) {
                    this._constraintList.append($('<li class="list-group-item list-group-item-success list">' +
                        constraints[i] +
                        '<span class="badge"><span class="glyphicon glyphicon-ok-sign"/></span></li>'));
                } else {
                    this._constraintList.append($('<li class="list-group-item list-group-item-danger">' +
                        constraints[i] +
                        '<span class="badge"><span class="glyphicon glyphicon-remove-sign"/></span></li>'));
                }
            } else {
                this._constraintList.append($('<li class="list-group-item list-group-item-info">' +
                    constraints[i] +
                    '<span class="badge"><span class="glyphicon glyphicon-question-sign"/></span></li>'));
            }
        }
    };

    FormulaEditorWidget.prototype.waitForResults = function () {
        this.setResults({});
        this._loader.start();
    };
    /* * * * * * * * Visualizer event handlers * * * * * * * */

    FormulaEditorWidget.prototype.onCheckConstraints = function () {
        this._logger.warn('The "onCheckConstraints" function is not overwritten');
    };

    FormulaEditorWidget.prototype.onSaveConstraints = function () {
        this._logger.warn('The "onSaveConstraints" function is not overwritten');
    };

    /* * * * * * * * Visualizer life cycle callbacks * * * * * * * */
    FormulaEditorWidget.prototype.destroy = function () {
        this._stopAutoSave();
    };

    FormulaEditorWidget.prototype.onActivate = function () {
        this._logger.debug('FormulaEditorWidget has been activated');
        this._startAutoSave();
    };

    FormulaEditorWidget.prototype.onDeactivate = function () {
        this._logger.debug('FormulaEditorWidget has been deactivated');
        this._stopAutoSave();
    };

    return FormulaEditorWidget;
});
