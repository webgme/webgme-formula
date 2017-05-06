/*globals require,module*/
/*jshint node:true*/
/**
 * @author kecso / https://github.com/kecso
 */
define([
    'q',
    'common/util/ejs',
    'text!src4ml/src/templates/language.4ml.ejs',
    'text!src4ml/src/templates/node.4ml.ejs',
    'text!src4ml/src/templates/project.4ml.ejs'
], function (Q, ejs, languageTemplate, nodeTemplate, projectTemplate) {
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
        return core.getAttribute(rootNode, '_formulaConstraints') || ' ';
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

    function getWholeProjectModelString(core, rootNode) {
        var deferred = Q.defer(),
            nodeTexts = [];

        core.traverse(rootNode, {excludeRoot: true}, function (visited, next) {
            // This is the visit function
            var nodeParameters = {
                    id: core.getPath(visited),
                    parent: core.getParent(visited) === null ? 'NULL' :
                        core.getPath(core.getParent(visited)),
                    type: {
                        name: core.getAttribute(core.getBaseType(visited), 'name'),
                        id: core.getPath(core.getBaseType(visited))
                    },
                    name: core.getAttribute(visited, 'name'),
                    pointerNames: core.getValidPointerNames(visited),
                    attributeNames: core.getValidAttributeNames(visited).sort(),
                    setNames: core.getValidSetNames(visited).sort(),
                    attributes: {},
                    pointers: {},
                    sets: {}
                },
                i;

            nodeParameters.pointerNames.push('base');
            nodeParameters.pointerNames.sort();
            nodeParameters.attributeNames.sort();
            nodeParameters.setNames.sort();

            for (i = 0; i < nodeParameters.attributeNames.length; i += 1) {
                nodeParameters.attributes[nodeParameters.attributeNames[i]] = {
                    type: core.getAttributeMeta(visited, nodeParameters.attributeNames[i]).type || 'string',
                    value: core.getAttribute(visited, nodeParameters.attributeNames[i])
                };
            }

            for (i = 0; i < nodeParameters.pointerNames.length; i += 1) {
                nodeParameters.pointers[nodeParameters.pointerNames[i]] =
                    core.getPointerPath(visited, nodeParameters.pointerNames[i]);
            }

            for (i = 0; i < nodeParameters.setNames.length; i += 1) {
                nodeParameters.sets[nodeParameters.setNames[i]] =
                    core.getMemberPaths(visited, nodeParameters.setNames[i]).sort();
            }

            nodeTexts.push(ejs.render(nodeTemplate, nodeParameters));
            next(null);
        })
            .then(function () {
                deferred.resolve(nodeTexts);
            })
            .catch(deferred.reject);

        return deferred.promise;
    }

    function buildUp4mlInputString(commitHash, projectName, language, constraints, nodes) {
        return ejs.render(projectTemplate, {
            commitHash: commitHash,
            projectName: projectName,
            language: language,
            nodes: nodes,
            constraints: constraints
        });
    }

    return {
        getConstraintDomainString: getConstraintDomainString,
        getLanguageDomainString: getLanguageDomainString,
        getWholeProjectModelString: getWholeProjectModelString,
        buildUp4mlInputString: buildUp4mlInputString
    };

});
