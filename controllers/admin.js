/**
 * Created by Administrator on 2017/8/10.
 */
var mongoose = require("mongoose")
var Admin = mongoose.models.admin
var Judge = mongoose.models.judge
var User = mongoose.models.user
var Config = require('../config.js')
var Constant = Config['Constant'] || {}
var template = require('./lib/template.js')
var md5 = require("blueimp-md5").md5
var _ = require("lodash")
var P = require("bluebird")
var Util = require("../lib/util.js")
var Path = require("path")
var json = {state: -1, message: '操作失败', data: {}}
var moment = require("moment")
moment.locale('zh-cn')

exports.dashboardView = function (req, res, next) {
    var username = req.session.username
    var options = {
        username:username,
        now:moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
        // L: Lang.getFile(req.session.lang, 'index')
    }
    res.go('/backend/admin/dashboard', options)
}

exports.errorView = function (req, res, next) {
    var options = {
        // L: Lang.getFile(req.session.lang, 'index')
    }
    res.go('/backend/admin/error', options)
}

exports.affichesView = function (req, res, next) {
    var options = {
        // L: Lang.getFile(req.session.lang, 'index')
    }
    res.go('/backend/admin/affiches', options)
}

exports.applyView = function (req, res, next) {
    var options = {
        // L: Lang.getFile(req.session.lang, 'index')
    }
    res.go('/backend/admin/applys', options)
}
exports.projectView = function (req, res, next) {
    var options = {
        // L: Lang.getFile(req.session.lang, 'index')
    }
    res.go('/backend/admin/projects', options)
}


exports.adminValidate = function (req,res,next) {
    var username = req.query.username
    Admin.PfindOne({username:username})
        .then(function(doc){
            if(doc){
                res.send("false")
            }else{
                res.send("true")
            }
        })
}

//登录页面
exports.loginView = function (req, res, next) {
    var options = {
        // L: Lang.getFile(req.session.lang, 'index')
    }
    res.go('/backend/admin/login', options)
}

exports.indexView = function (req, res, next) {
    User.find({user_status:2})
        .then(function(doc){
            if(doc.length == 0){
                var en = 0
            }else{
                var en = 1
            }
            console.log("en",en)
            var options = {
                username:req.session.username,
                role:req.session.role,
                en:en
            }
            res.go('/backend/admin/index', options)
        })

}

exports.adminAddView = function (req, res, next) {
    var options = {
        // L: Lang.getFile(req.session.lang, 'index')
    }
    res.go('/backend/admin/admin-add', options)
}

exports.adminsView = function (req, res, next) {
    var current = req.query.current || 1
    var pagesize = req.query.pagesize || 10
    var skips = (current * pagesize) - pagesize;
    Admin.find({}).then(function (all) {
        Admin.find({}).skip(skips).limit(pagesize).then(function(doc){
            var options = {
                // L: Lang.getFile(req.session.lang, 'index')
                admins:doc,
                current:current,
                pagesize:pagesize,
                pagecount:all.length
            }
            res.go('/backend/admin/admins', options)
        })
    })
}

exports.adminAdd = function (req, res, next) {
    var id = req.body.id
    var username = req.body.username
    var password = req.body.password
    var email = req.body.email
    var name = req.body.name
    var tel = req.body.tel
    var enable = false
    //新增
    if(id=="0"){
        var registeTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
        var lastTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
        Admin.Pinsert({username:username,password:password,email:email,name:name,tel:tel,registeTime:registeTime,lastTime:lastTime,enable:enable})
            .then(function (doc) {
                res.send(true)
            })
    }
    //更新
    else{
        Admin.PfindOneAndUpdate({_id:id},{$set:{username:username,password:password,email:email,name:name,tel:tel,enable:enable,lastTime:lastTime}}).then(function (doc) {
            res.send(true)
        })
    }
}

exports.adminDelete = function (req, res, next) {
    var ids = req.body.ids
    var _ids=ids.split(",")
    for (var i=0;i<_ids.length;i++){
        console.log("Delete ID:"+_ids[i])
        Admin.PdeleteById(_ids[i])
    }
    res.send(true)
}

exports.adminEnable = function (req,res,next) {
    var id = req.body.id
    var action = req.body.action
    if(action=="start"){
        res.send(Admin.Penable(id,true))
    }else if(action=="stop"){
        res.send(Admin.Penable(id,false))
    }
}

exports.adminEdit = function (req,res,next) {
    var id = req.body.id
    Admin.PfindOne({_id:id}).then(function (doc) {
        if(doc){
            res.send(doc)
        }
    })
}

//登录逻辑 TODO 用户登录跳转到用户界面
exports.loginLogic = function (req,res,next) {
    var username = req.body.username
    var password = req.body.password
    var message = "登录异常"
    Admin.PfindOne({username:username})
        .then(function(admin){
            if(admin){
                var role = admin.role
                console.log(role)
                if(admin.password == password && admin.enable==true && admin.admin_role>1){
                    req.session.username = username
                    req.session.role = admin.admin_role
                    res.send(true)
                }else{
                    message = "密码错误，请重新输入!"
                    res.send(message)
                }
            }else{
                User.PfindOne({enterprise:username})
                    .then(function(user){
                        if(user){
                            if(user.password == password){
                                console.log(user)
                                req.session.username = username
                                req.session.role = user.role
                                console.log(req.session.role)
                                res.send(true)
                            }else{
                                message = "密码错误，请重新输入!"
                                res.send(message)
                            }
                        }else{
                            Judge.PfindOne({name:username})
                                .then(function(judge){
                                    if(judge){
                                        if(judge.password == password){
                                            req.session.username = username
                                            req.session.role = judge.judge_role
                                            res.send(true)
                                        }else{
                                            message = "密码错误，请重新输入!"
                                            res.send(message)
                                        }
                                    }else{
                                        message = "用户名不存在，请重新输入"
                                        res.send(message)
                                    }
                                })
                        }
                    })
            }
        }).catch(function(err){
        console.trace(err)
        message = "系统服务出现问题"
        res.send(message)
    })
}

exports.logoutLogic = function (req,res,next) {
    delete req.session.username
    res.redirect("/admin/login.html")
}

