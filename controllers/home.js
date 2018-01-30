/**
 * Created by Administrator on 2017/9/6.
 */
var mongoose = require("mongoose")
var Project = mongoose.models.project
var User = mongoose.models.user
var Notice = mongoose.models.notice
var Config = require('../config.js')
var Constant = Config['Constant'] || {}
var template = require('./lib/template.js')
var md5 = require("blueimp-md5").md5
var _ = require("lodash")
var P = require("bluebird")
var Util = require("../lib/util.js")
var Path = require("path")
var json = {state: -1, message: '操作失败', data: {}}
var Excel = require('excel-class')
var multer = require('multer')
var fs = require('fs')
var nodeExcel = require('excel-export')
var common = require('./common')
var WechatAPI = require('wechat-api');
var WechatOauth = require('wechat-oauth')
var api = new WechatAPI(global.WEIXIN_APPID, global.WEIXIN_APPSECRET);
var moment = require("moment")
moment.locale('zh-cn')

//项目列表逻辑
exports.projectLogic = function (req,res,next) {
    Project.find({status:1}).sort({update_time:-1})
        .then(function(doc){
            var length = JSON.stringify(doc.length)
            Project.find({status:1}).sort({update_time:-1}).limit(10)
                .then(function(doc2){
                    var options = {
                        length:length,
                        projects:JSON.stringify(doc2),
                    }
                    res.go("/frontend/project",options)
                })
        })
}

exports.projectSearch = function (req,res,next){
    var name = req.body.name
    if(name){
        Project.find({name:eval('/'+name+'.*/i'),status:1}).sort({update_time:-1})
            .then(function (doc) {
                res.send(doc)
            })
    }else{
        Project.find({status:1}).sort({update_time:-1})
            .then(function (doc) {
                res.send(doc)
            })
    }

}
//查看该项目下的所有公告
exports.showNotice = function(req,res,next){
    var name = req.query.name
    Notice.find({project:name})
        .then(function(doc){
            var options = {
                name:name,
                projects:JSON.stringify(doc)
            }
            res.go("/frontend/notice",options)
        })
}

//公告列表逻辑
exports.noticeLogic = function (req,res,next) {
    Notice.find({}).sort({update_time:-1})
        .then(function(doc){
            var length = doc.length
            Notice.find({}).sort({update_time:-1}).limit(10)
                .then(function(doc2){
                    var options = {
                        length:length,
                        notices:JSON.stringify(doc2),
                    }
                    console.log("option",options)
                    res.go("/frontend/affiche",options)
                })
        })
}
//验证项目状态
exports.fileVerify = function(req,res,next){
    var name = req.body.project
    console.log("name",name)
    var status
    Project.PfindOne({name:name})
        .then(function(doc){
            if(doc.status == 1){
                res.send({status:1})
            }else{
                res.send({status:0})
            }
        })
}
exports.wechatAuthHandler = function (req, res, next) {
    var options = {}

    var wechatOauth = new WechatOauth(global.WEIXIN_APPID, global.WEIXIN_APPSECRET)
    var code = req.query.code
    console.log('code:', code)
    // 未登录状态并且不带任何认证的连接code, 都需要重定向微信授权登录连接
    if (!code && (!req.session || !req.session.username || req.session.role == undefined)) {
        return res.redirect('https://open.weixin.qq.com/connect/oauth2/authorize?appid=' + global.WEIXIN_APPID + '&redirect_uri=http://tieta.1g9f.com' + req.url + '&response_type=code&scope=snsapi_userinfo&state=STATE&connect_redirect=1#wechat_redirect')
    }
    wechatOauth.getAccessToken(code, function (err, accessToken) {
        // console.trace('err:', err)
        // console.log('result:', accessToken)
        if (err || !accessToken || !accessToken.data) {
            // 提示errcode":40163,"errmsg":"code been used。说明code被使用过一次了，官方文档说的很清楚，code只能用一次
            return next()
        }
        var openid = accessToken.data.openid
        req.session.openid = openid
            // console.log('openid:', openid)
        _.extend(options, {openid: openid})
        wechatOauth.getUser(openid, function (err, userInfo) {
            if (err || !userInfo) {
                // 传参到页面提交绑定和登录
                return res.go('home/bind', options)
            }else{
                var headimgurl = userInfo.headimgurl
                req.session.headimgurl = headimgurl
                console.log("headimgurl",headimgurl)
            }
            next()

        })
    })
}

exports.personWs = function (req,res,next) {
    var options = {

    }
    res.go("/frontend/info",options)
}
exports.person = function (req,res,next) {
    var compan = req.session.compan
    console.log("compan",compan)
    User.find({enterprise:compan})
        .then(function(doc){
            var options = {
                users:JSON.stringify(doc),
            }
            res.go("/frontend/center",options)
        })
}
exports.userLoginView = function (req,res,next) {
    var options = {

    }
    res.go("/frontend/login",options)
}
exports.userLogin = function (req,res,next){
    var username = req.body.username
    var password = req.body.password
    var verify
    User.PfindOne({enterprise:username})
        .then(function(user) {
            if (user) {
                if (user.password == password) {
                    req.session.role = 0
                    req.session.compan = username
                    console.log(req.session.role)
                    verify = "success"
                    res.send(verify)
                } else {
                    verify = "errpassword"
                    res.send(verify)
                }
            } else {
                verify = "exist"
                res.send(verify)
            }
        })
}
exports.personLogic = function (req,res,next) {
    var personRole = req.session.role
    console.log("role",personRole)
    if(personRole == 0){
        res.redirect("/frontend/center.html")
    }else{
        res.redirect("/frontend/login.html")
    }
}

exports.verify = function (req,res,next) {
    var compan = req.session.compan
    User.PfindOne({enterprise:compan})
        .then(function(doc){
            var project = doc.project
            var options = {
                project:JSON.stringify(project)
            }
            console.log("option",options)
            res.go("/frontend/reviews",options)
        })
}
