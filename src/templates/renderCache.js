/**
 * @author kecso / https://github.com/kecso
 */
define([
    'common/util/ejs',
    'text!./section.1.ejs',
    'text!./section.2.ejs',
    'text!./section.3.ejs',
    'text!./section.4.ejs'
], function (ejs,
             s1,
             s2,
             s3,
             s4) {

    return {raw: {s1: s1, s2: s2, s3: s3, s4: s4}};
});