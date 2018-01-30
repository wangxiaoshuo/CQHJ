/**
 * Created by Administrator on 2017/8/11.
 */

var Path = require('path')

exports.resolveRelative = function (___filename, relative) {
    return Path.join(Path.dirname(___filename), relative)
}

exports.isEmail = function (str) {
    var regEmail = /^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$/gi
    return regEmail.test(str)
}

exports.trim = function (text) {
    if (typeof(text) == "string") {
        return text.replace(/^\s*|\s*$/g, "");
    }
    else {
        return text;
    }
}
exports.isEmpty = function (val) {
    switch (typeof(val)) {
        case 'string':
            return exports.trim(val).length == 0 ? true : false;
            break;
        case 'number':
            return val == 0;
            break;
        case 'object':
            return val == null || val == {};
            break;
        case 'array':
            return val.length == 0;
            break;
        default:
            return true;
    }
}