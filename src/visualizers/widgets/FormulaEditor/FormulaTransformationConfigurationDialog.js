/**
 * @author kecso / https://github.com/kecso
 */

define([
    'js/DragDrop/DropTarget',
    'text!./FormulaTransformationConfigurationDialog.html'
], function (dropTarget, ConfigurationHtml) {
    'use strict';

    var FormulaTransformationConfigurationDialog = function (containerElement, configuration) {
        this._configuration = configuration;
        this._el = containerElement;
        this._el.append(ConfigurationHtml);
        this._selfEl = this._el.find('#transformationDialog').first();
        this._initialize();
        this._okCallback = null;
    };

    FormulaTransformationConfigurationDialog.prototype._initialize = function () {
        var self = this;
        this._okBtn = this._el.find('#okBtn').first();
        this._okBtn.on('click', function (event) {
            var cb = self._okCallback;
            self._okCallback = null;
            if (cb) {
                cb();
            }
        });

        this._targetDrop = this._el.find('#targetDrop').first();
        dropTarget.makeDroppable($(this._el).find('#targetDrop'), {
            drop: function (event, dragInfo) {
                var i;
                for (i = 0; i < dragInfo.DRAG_ITEMS.length; i += 1) {
                    if (dragInfo.DRAG_ITEMS[i]) { //The root cannot be transformed!
                        self._configuration.targetIds.push(dragInfo.DRAG_ITEMS[i]);
                    }
                }
                self._refresh();
            }
        });

        this._targetClearBtn = this._el.find('#targetRemoveBtn').first();
        this._targetClearBtn.on('click', function (event) {
            self._configuration.targetIds = [];
            self._refresh();
        });

        this._parentDrop = this._el.find('#parentDrop').first();
        dropTarget.makeDroppable($(this._el).find('#parentDrop'), {
            drop: function (event, dragInfo) {
                self._configuration.parentId = dragInfo.DRAG_ITEMS[0];
                self._refresh();
            }
        });

        this._parentClearBtn = this._el.find('#parentRemoveBtn').first();
        this._parentClearBtn.on('click', function (event) {
            self._configuration.parentId = '';
            self._refresh();
        });
    };

    FormulaTransformationConfigurationDialog.prototype._refresh = function () {
        // this._targetDrop.val();
        var i, dropValue = '';
        for (i = 0; i < this._configuration.targetIds.length; i += 1) {
            dropValue += this._configuration.targetIds[i] + '; ';
        }
        this._targetDrop.val(dropValue);

        this._parentDrop.val(this._configuration.parentId || '');
    };

    FormulaTransformationConfigurationDialog.prototype.show = function (callback) {
        this._okCallback = callback;
        this._refresh();
        $(this._selfEl).show();
    };

    FormulaTransformationConfigurationDialog.prototype.hide = function () {
        $(this._selfEl).hide();
    };
    return FormulaTransformationConfigurationDialog;
});
