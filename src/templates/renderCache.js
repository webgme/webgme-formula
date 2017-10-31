/**
 * @author kecso / https://github.com/kecso
 */
define([
    'common/util/ejs',
    'text!./domainPrefix.4ml.ejs',
    'text!./domainPostfix.4ml.ejs',
    'text!./metaElement.4ml.ejs',
    'text!./modelElement.4ml.ejs',
    'text!./modelElements.4ml.ejs',
    'text!./modelPrefix.4ml.ejs',
    'text!./model.4ml.ejs',
    'text!./meta.4ml.ejs'
], function (ejs,
             domainPrefix,
             domainPostfix,
             metaElement,
             metaElements,
             modelElement,
             modelPrefix,
             model,
             meta) {

    var domainEjs = ejs.render(domain, {prefix: domainPrefix, postfix: domainPostfix}),
        metaElementsEjs = ejs.render(metaElements, {singleExtract: metaElement}),
        modelElementsEjs = "";

    return {
        statics: {
            domain: domainPrefix,
            closing: domainPostfix
        },
        templates: {
            domainPrefix: domainPrefix,
            domainPostfix: domainPostfix,
            domain: domainEjs,
            metaModel: ejs.render(meta, {
                domain: domainEjs,
                metaElement: metaElement,
                postfix: domainPostfix
            }),
            model: ejs.render(model, {
                domain: domainEjs,
                meta: metaElementsEjs,
                model: modelElementsEjs,
                postfix: domainPostfix
            })
        }
    };
});