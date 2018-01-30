/**
 * Created by Administrator on 2017/8/10.
 */
'use strict';

var template = require('art-template')

// 兼容json对象以字符串输出
template.helper('toJsonString', function (obj) {
    if (typeof obj === "object") {
        return JSON.stringify(obj)
    }
    return ''
})

// 兼容对象_id属性值以字符串输出
template.helper('toString', function (obj) {
    if (typeof obj === "object") {
        return obj.toString()
    }
    return ''
})

template.helper('dateFormat', function (date, format) {
    if (typeof date === "string") {
        var mts = date.match(/(\/Date\((\d+)\)\/)/);
        if (mts && mts.length >= 3) {
            date = parseInt(mts[2]);
        }
    }
    date = new Date(date);
    if (!date || date.toUTCString() == "Invalid Date") {
        return "";
    }

    var map = {
        "M": date.getMonth() + 1,
        "d": date.getDate(),
        "h": date.getHours(),
        "m": date.getMinutes(),
        "s": date.getSeconds(),
        "q": Math.floor((date.getMonth() + 3) / 3),
        "S": date.getMilliseconds()
    };


    format = format.replace(/([yMdhmsqS])+/g, function(all, t){
        var v = map[t];
        if(v !== undefined){
            if(all.length > 1){
                v = '0' + v;
                v = v.substr(v.length-2);
            }
            return v;
        }
        else if(t === 'y'){
            return (date.getFullYear() + '').substr(4 - all.length);
        }
        return all;
    });
    return format;
})

template.helper('imageForBig', function (path) {
    path = path.replace('/data/images', '/data/images/big')
    return path
})

template.helper('roleForLabel', function (role) {
    var label = '投标人'
    if (role == global.ACCOUNT_ROLES.bidders) {
        label = '投标人'
    } else if (role == global.ACCOUNT_ROLES.manager) {
        label = '管理员'
    }
    return label
})