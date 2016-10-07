/**
 * @author kecso / https://github.com/kecso
 */
/*globals define*/
/*jshint node:true, browser:true*/
define([
    'common/util/ejs',
    'text!./Templates/language.4ml.ejs'
], function (ejs, languageTemplate) {

    function getSubTypesOfNode(client, languageNodes, node) {
        var subTypePaths = [],
            i;

        for (i = 0; i < languageNodes.length; i += 1) {
            if (client.isTypeOf(languageNodes[i].getId(), node.getId())) {
                subTypePaths.push(languageNodes[i].getId());
            }
        }
        subTypePaths.sort();

        return subTypePaths;
    }

    function getParentTypes(client, languageNodes, node) {
        var parentTypePaths = [],
            i;

        for (i = 0; i < languageNodes.length; i += 1) {
            if (client.isValidChild(languageNodes[i].getId(), node.getId())) {
                parentTypePaths.push(languageNodes[i].getId());
            }
        }

        parentTypePaths.sort();

        return parentTypePaths;
    }

    function getPointerInfo(client, languageNodes, node) {
        var info = {},
            names = node.getValidPointerNames().sort(),
            i, j;

        //TODO find a proper way to fill this info
        info['base'] = ['/1'];
        for (i = 0; i < names.length; i += 1) {
            info[names[i]] = [];
            for (j = 0; j < languageNodes.length; j += 1) {
                if (client.isValidTarget(node.getId(), names[i], languageNodes[j].getId())) {
                    info[names[i]].push(languageNodes[j].getId());
                }
            }
            info[names[i]].sort();
        }

        return info;
    }

    function getSetInfo(client, languageNodes, node) {
        var info = {},
            names = node.getValidSetNames(node).sort(),
            i, j;

        for (i = 0; i < names.length; i += 1) {
            info[names[i]] = [];
            for (j = 0; j < languageNodes.length; j += 1) {
                if (client.isValidTarget(node.getId(), names[i], languageNodes[i].getId())) {
                    info[names[i]].push(languageNodes[i].getId());
                }
            }
            info[names[i]].sort();
        }

        return info;
    }

    function getLanguageAsString(client) {
        var i, languageNodes = client.getAllMetaNodes(),
            node,
            id,
            languageParameters = {
                nodes: {},
                order: []
            };

        // TODO because of the different source of language nodes this has to be synchronized to GenFORMULA.js.
        for (i = 0; i < languageNodes.length; i += 1) {
            node = languageNodes[i];
            id = node.getId();
            languageParameters.order.push(id);
            languageParameters.nodes[id] = {
                id: id,
                // guid: node.getGuid(),
                base: node.getBaseId(),
                name: node.getFullyQualifiedName(),
                parentTypes: getParentTypes(client, languageNodes, node),
                subTypes: getSubTypesOfNode(client, languageNodes, node),
                meta: client.getMeta(id),
                pointerNames: node.getValidPointerNames(),
                pointerInfo: getPointerInfo(client, languageNodes, node),
                attributeNames: node.getValidAttributeNames(),
                setNames: node.getValidSetNames(),
                setInfo: getSetInfo(client, languageNodes, node)
            };
            languageParameters.nodes[id].pointerNames.push('base');
            languageParameters.nodes[id].pointerNames.sort();
            languageParameters.nodes[id].setNames.sort();
            languageParameters.nodes[id].attributeNames.sort();
        }

        languageParameters.order.sort();

        return ejs.render(languageTemplate, languageParameters);
    }

    function convertIdString(input) {
        return input.replace(/ /g, "_").replace(/\//g, "_");
    }

    function getUserConstraintNames(userConstraints) {
        var names = userConstraints.match(/\w+(?= *:-[\s\S]*\.)/g) || [],
            i = names.length;
        while (i--) {
            if (names.indexOf(names[i]) !== i) {
                names.splice(i, 1);
            }
        }
        return names;
    }

    function getCompleteFormulaTranslation(client, callback) {
        var startingCommit = client.getActiveCommitHash(),
            pluginContext = client.getCurrentPluginContext('GenFORMULA', '');

        client.runServerPlugin('GenFORMULA', pluginContext, function (err, pluginResult) {
            if (startingCommit === client.getActiveCommitHash()) {
                if (!err) {
                    if (pluginResult.success === true && pluginResult.messages.length > 1) {
                        pluginResult = pluginResult.messages[0].message;

                        //removing the first two lines to make identical to getLanguagesAsString
                        pluginResult = pluginResult.split('\n');
                        pluginResult.splice(0,2);
                        pluginResult = pluginResult.join('\n');
                    } else {
                        err = new Error("Invalid result format received!");
                    }
                }

                callback(err, pluginResult);
            }
        });
    }

    return {
        getLanguageAsString: getLanguageAsString,
        convertIdString: convertIdString,
        getUserConstraintNames: getUserConstraintNames,
        getCompleteFormulaTranslation: getCompleteFormulaTranslation
    }
});