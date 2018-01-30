/**
 * Created by Administrator on 2017/8/29.
 */
/**
 * Created by Administrator on 2017/8/24.
 */
var mongoose = require("mongoose")
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
var moment = require("moment")
moment.locale('zh-cn')

exports.pageLogic = function (req,res,next) {
    var length = req.body.s
    var status = req.body.status
    var compan = req.body.compan
    console.log("status>>>>>",status)
    console.log("c",compan)
    if(compan != ""){
        Notice.find({enterprise:eval('/'+compan+'.*/i')}).sort({update_time:-1}).limit(10)
            .then(function(doc){
                res.send(doc)
            })
    }else if(status != "" && status!= undefined && status != -1){
        Notice.find({status:status}).sort({update_time:-1}).skip(10*(length-1)).limit(10)
            .then(function(doc){
                res.send(doc)
            })
    }else{
        Notice.find({}).sort({update_time:-1}).skip(10*(length-1)).limit(10)
            .then(function(doc){
                res.send(doc)
            })
    }

}

exports.noticeValidate = function (req,res,next) {
    var notice = req.query.name
    console.log("username:"+notice)
    Notice.PfindOne({name:notice})
        .then(function(doc){
            if(doc){
                res.send("false")
            }else{
                res.send("true")
            }
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
                    res.go("/backend/admin/affiches",options)
                })
        })
}
//增加或更新
exports.noticeAdd = function(req,res,next){
    var id = req.body.id
    var name = req.body.name
    var project = req.body.project
    var username = req.session.username
    var insert = {name:name,project:project,time:moment(new Date()).format('YYYY-MM-DD'),update_time:moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),admin_id:username}
    var update = {name:name,project:project,update_time:moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),admin_id:username}
    console.log("id>>>>",id)
    console.log("name>>>>>>>>>>>",name)
    if(id != "" && id != null && id != undefined){
        Notice.PfindOneAndUpdate({_id:id},{$set:update}).then(function (doc) {
            res.send(true)
        })
            .catch(function(err){
                console.log(err)
            })
    }else {
        Notice.Pinsert(insert)
            .then(function (doc) {
                req.session.notice = name
                req.session.project = project
                console.log("session>>>>>",req.session.notice)
                console.log("session project>>>>>",req.session.project)
                res.send(true)
            })
    }
}

//查询公告
exports.noticeSearch = function (req,res,next) {
    var notice = req.body.notice
    Notice.find({name:eval('/'+notice+'.*/i')}).sort({update_time:-1})
        .then(function (doc) {
            res.send(doc)
        })
}
//删除公告信息
exports.noticeDelete = function (req,res,next) {
    var ids = req.body.ids
    var _ids=ids.split(",")
    console.log(_ids)
    console.log(ids)
    for(var i = 0;i<_ids.length;i++){
        Notice.PdeleteById(_ids[i])
    }
    res.send(true)
}

//渲染编辑页面
exports.noticeEdit = function (req, res, next) {
    var id = req.body.id
    console.log("id>>>>",id)
    Notice.PfindOne({_id:id})
        .then(function(doc){
            res.send(doc)
        })
        .catch(function(err){
            console.log(err)
        })
}

exports.noticeAddView = function(req,res,next){
    var options = {

    }
    res.go("/backend/admin/affiche-add",options)
}