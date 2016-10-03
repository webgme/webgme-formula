/**
 * @author kecso / https://github.com/kecso
 */
/*globals define*/
/*jshint node:true, browser:true*/
define([
    'common/util/ejs',
    'text!./Templates/language.4ml.ejs'
], function (ejs, languageTemplate) {

    function getLanguageAsString(client) {
        var i, languageNodes = client.getAllMetaNodes(),
            node,
            id,
            languageParameters = {
                nodes: {}
            };

        languageNodes.sort(function (n1, n2) {
            return n1.getId().localeCompare(n2.getId());
        });

        // TODO because of the different source of language nodes this has to be synchronized to GenFORMULA.js.
        for (i = 0; i < languageNodes.length; i += 1) {
            node = languageNodes[i];
            id = node.getId();
            languageParameters.nodes[id] = {
                id: id,
                // guid: node.getGuid(),
                base: node.getBaseId(),
                name: node.getAttribute('name'),
                parent: node.getParentId(),
                isConnection: node.isConnection(),
                meta: client.getMeta(id),
                pointerNames: node.getValidPointerNames().sort(),
                attributeNames: node.getValidAttributeNames().sort()
            };
        }

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