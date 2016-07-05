/**
 * @author kecso / https://github.com/kecso
 */
/*globals define*/
/*jshint node:true, browser:true*/
define([
    'common/util/ejs',
    'text!./Templates/language.4ml.ejs'
], function (ejs, languageTemplate) {

    /**
     * The funciton generates the Formula domain representaiton of the model.
     *
     * @param gmeNodes[] metaNodes - The array of gmeNodes that provides the complete language of the project.
     */
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
        return userConstraints.match(/\w+(?= *:-[\s\S]*\.)/g) || [];
    }

    return {
        getLanguageAsString: getLanguageAsString,
        convertIdString: convertIdString,
        getUserConstraintNames: getUserConstraintNames
    }
});