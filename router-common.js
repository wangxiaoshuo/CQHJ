'use strict';

var Config = require('./config.js')
var Constant = Config['Constant'] || {}
var IS_CONFUSION = Constant['IS_CONFUSION'] || false

module.exports = function (app) {
    errorHandler(app)
}

function errorHandler(app) {
    app.use(function (req, res, next) {
        console.error('404 来自于: ', req.headers['x-real-ip'], req.headers['x-forwarded-for'], ' 请求网址: ', req.url)
        res.status(404);
        if (global.isAPI) {
            res.send({state: -1, message: '404请求连接找不到'})
        } else {
            res.go('error', {error: '404网站页面找不到'})
        }
    })

    app.use(function (err, req, res, next) {
        console.trace(err)
        var status = err.state || 500
        res.status(status);
        if (global.isAPI) {
            res.send({state: -1, message: '500服务器内部错误, Ref: ' + err.message})
        } else {
            res.go('error', {error: '500服务器内部错误'})
        }
    })
}