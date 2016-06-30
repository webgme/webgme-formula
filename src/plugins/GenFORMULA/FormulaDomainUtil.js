/**
 * @author kecso / https://github.com/kecso
 */
/*globals define*/
/*jshint node:true, browser:true*/
define([
    'common/util/ejs',
    'text!./Templates/language.4ml.ejs'
], function (ejs, domainTemplate) {

    /**
     * The funciton generates the Formula domain representaiton of the model.
     *
     * @param gmeNodes[] metaNodes - The array of gmeNodes that provides the complete language of the project.
     */
    function getDomain(client, metaNodes) {
        var i, j,
            names,
            node,
            id,
            testData = {
                domainName: client.getActiveProjectName(),
                formulaVersion: 2,
                formula: {
                    lineEnding: '.',
                    true: 'TRUE',
                    false: 'FALSE'
                },
                nodes: {}
            };

        metaNodes.sort(function (n1, n2) {
            return n1.getId().localeCompare(n2.getId());
        });

        for (i = 0; i < metaNodes.length; i += 1) {
            node = metaNodes[i];
            id = node.getId();
            testData.nodes[id] = {
                id: id,
                guid: node.getGuid(),
                base: node.getBaseId(),
                meta: id, //there are all meta-nodes
                name: node.getAttribute('name'),
                parent: node.getParentId(),
                isAbstract: node.isAbstract(),
                isMetaType: true,
                jsonMeta: client.getMeta(id)
            };
        }

        return ejs.render(domainTemplate, testData);
    }

    function getFormulaIdPrefixFromPath(path) {
        return 'node_' + path.replace("/", "_");
    }

    return {
        getDomain: getDomain,
        getFromulaIdPrefixFromPath: getFormulaIdPrefixFromPath
    }
});