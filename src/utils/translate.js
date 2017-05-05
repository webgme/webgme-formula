/*globals require,module*/
/*jshint node:true*/
/**
 * @author kecso / https://github.com/kecso
 */
define([
    'common/util/ejs',
    'text!src4ml/src/templates/language.4ml.ejs'
], function (ejs, languageTemplate) {
    'use strict';

    function getSubTypesOfNode(core, metaNodes, path) {
        var subTypePaths = [],
            subTypePath;

        for (subTypePath in metaNodes) {
            if (core.isTypeOf(metaNodes[subTypePath], metaNodes[path])) {
                subTypePaths.push(subTypePath);
            }
        }
        subTypePaths.sort();

        return subTypePaths;
    }

    function getParentTypes(core, metaNodes, path) {
        var parentTypePaths = [],
            parentTypePath;

        for (parentTypePath in metaNodes) {
            if (core.isValidChildOf(metaNodes[path], metaNodes[parentTypePath])) {
                parentTypePaths.push(parentTypePath);
            }
        }

        parentTypePaths.sort();

        return parentTypePaths;
    }

    function getPointerInfo(core, metaNodes, path) {
        var info = {},
            names = core.getValidPointerNames(metaNodes[path]),
            i, targetPath;

        info['base'] = ['/1'];
        for (i = 0; i < names.length; i += 1) {
            info[names[i]] = [];
            for (targetPath in metaNodes) {
                if (core.isValidTargetOf(metaNodes[targetPath], metaNodes[path], names[i])) {
                    info[names[i]].push(targetPath);
                }
            }
            info[names[i]].sort();
        }

        return info;
    }

    function getSetInfo(core, metaNodes, path) {
        var info = {},
            names = core.getValidSetNames(metaNodes[path]),
            i, targetPath;

        for (i = 0; i < names.length; i += 1) {
            info[names[i]] = [];
            for (targetPath in metaNodes) {
                if (core.isValidTargetOf(metaNodes[targetPath], metaNodes[path], names[i])) {
                    info[names[i]].push(targetPath);
                }
            }
            info[names[i]].sort();
        }

        return info;
    }

    function getConstraintDomainString(core, rootNode) {
        return core.getAttribute(rootNode, '_formulaConstraints') || '';
    }

    function getLanguageDomainString(core, rootNode) {
        var metaNodes = core.getAllMetaNodes(rootNode),
            ejsParameters = {
                order: Object.keys(metaNodes || {}).sort(),
                nodes: {}
            }, i, node;

        for (i = 0; i < ejsParameters.order.length; i += 1) {
            node = metaNodes[ejsParameters.order[i]];
            ejsParameters.nodes[ejsParameters.order[i]] = {
                id: ejsParameters.order[i],
                // guid: self.core.getGuid(node),
                // base: self.core.getPath(self.core.getBase(node)),
                // type: self.core.getPath(self.core.getBaseType(node)),
                name: core.getFullyQualifiedName(node),
                parentTypes: getParentTypes(core, metaNodes, ejsParameters.order[i]),
                subTypes: getSubTypesOfNode(core, metaNodes, ejsParameters.order[i]),
                // isAbstract: self.core.isAbstract(node),
                // isConnection: self.core.isConnection(node),
                meta: core.getJsonMeta(node),
                pointerNames: core.getValidPointerNames(node),
                pointerInfo: getPointerInfo(core, metaNodes, ejsParameters.order[i]),
                attributeNames: core.getValidAttributeNames(node),
                setNames: core.getValidSetNames(node),
                setInfo: getSetInfo(core, metaNodes, ejsParameters.order[i])
            };
            ejsParameters.nodes[ejsParameters.order[i]].pointerNames.push('base');
            ejsParameters.nodes[ejsParameters.order[i]].pointerNames.sort();
            ejsParameters.nodes[ejsParameters.order[i]].attributeNames.sort();
            ejsParameters.nodes[ejsParameters.order[i]].setNames.sort();
        }

        return ejs.render(languageTemplate, ejsParameters);
    }

    return {
        getConstraintDomainString: getConstraintDomainString,
        getLanguageDomainString: getLanguageDomainString
    };

});
