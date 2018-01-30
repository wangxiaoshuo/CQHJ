/**
 * Created by Administrator on 2017/8/24.
 */
var mongoose = require("mongoose")
var Project = mongoose.models.project
var User = mongoose.models.user
var Judge = mongoose.models.judge
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
var WechatAPI = require('wechat-api');
var api = new WechatAPI(global.WEIXIN_APPID, global.WEIXIN_APPSECRET);
//定时任务
var schedule = require('node-schedule');

exports.pageLogic = function (req,res,next) {
    var length = req.body.s
    var status = req.body.status
    var compan = req.body.compan
    console.log("status>>>>>",status)
    console.log("c",compan)
    if(compan != ""){
        Project.find({enterprise:eval('/'+compan+'.*/i')}).sort({status:1}).limit(10)
            .then(function(doc){
                res.send(doc)
            })
    }else if(status != "" && status!= undefined && status != -1){
        Project.find({status:status}).sort({status:1}).skip(10*(length-1)).limit(10)
            .then(function(doc){
                res.send(doc)
            })
    }else{
        Project.find({}).sort({status:1}).skip(10*(length-1)).limit(10)
            .then(function(doc){
                res.send(doc)
            })
    }

}

exports.applyPageLogic = function (req,res,next) {
    var length = req.body.s
    var status = req.body.status
    var compan = req.body.compan
    console.log("status>>>>>",status)
    console.log("c",compan)
    Project.find({}).sort({status:1}).skip(10*(length-1)).limit(10)
        .then(function(doc){
            res.send(doc)
        })
}
exports.reviewPageLogic = function (req,res,next) {
    var length = req.body.s
    var status = req.body.status
    var compan = req.body.compan
    console.log("status>>>>>",status)
    console.log("c",compan)
    Project.find({status:3}).sort({update_time:-1}).skip(10*(length-1)).limit(10)
        .then(function(doc){
            res.send(doc)
        })
}
//项目评审页逻辑
exports.reviewView = function (req, res, next) {
    Project.find({$or:[{'status':3},{'status':5}]}).sort({update_time:-1})
        .then(function(doc){
            var length = JSON.stringify(doc.length)
            Project.find({$or:[{'status':3},{'status':5}]}).sort({update_time:-1}).limit(10)
                .then(function(doc2){
                    var options = {
                        length:length,
                        projects:JSON.stringify(doc2),
                    }
                    res.go("/backend/admin/reviews",options)
                })
        })
}
//缴纳凭证审核
exports.pzVerify = function (req,res,next) {
    var id = req.body.id
    var key = req.body.key
    console.log("id",id)
    console.log("key",key)
    if(key == 1) {//确定结果
        Project.update({_id:id},{$set:{status:7}})//项目结束
            .then(function(){
                Project.PfindOne({_id:id})
                    .then(function(project) {
                        var name = project.name //项目名称
                        User.PfindOne({"voucher":{$elemMatch:{"project":name}}})
                            .then(function(user) {
                                    var openid = user.openid
                                    var pro = user.project
                                    for(var i in pro){
                                        if(pro[i].name == name){
                                            pro[i].result[0] = 4
                                            pro[i].result[1] = moment(new Date()).format('LL')
                                            User.update({"openid":openid},{$set:{"project":pro}})
                                                .then(function(){
                                                    res.send(true)
                                                })
                                        }
                                    }
                            })
                    })
            })
    }else if(key == 0){
        Project.update({_id:id},{$set:{status:4}})//审核未通过，重新上传凭证
            .then(function(){
                Project.PfindOne({_id:id})
                    .then(function(project) {
                        var name = project.name //项目名称
                        var voucher = project.voucher//凭证
                        voucher.splice(0,voucher.length)
                        Project.update({_id:id},{$set:{voucher:voucher}})
                            .then(function(){
                                User.PfindOne({"voucher":{$elemMatch:{"project":name}}})
                                    .then(function(user) {
                                        console.log("vou", user)
                                        if (user) {
                                            var openid = user.openid
                                            var pro = user.project
                                            var voucher = user.voucher
                                            console.log("voucher",voucher)
                                            for(var j in voucher){
                                                if(voucher[j].project == name){
                                                    voucher[j].project = "un"
                                                    User.update({"openid":openid},{$set:{"voucher":voucher}})
                                                        .then(function(){
                                                            for(var i in pro){
                                                                if(pro[i].name == name){
                                                                    pro[i].result[0] = -1
                                                                    pro[i].result[1] = moment(new Date()).format('LL')
                                                                    User.update({"openid":openid},{$set:{"project":pro}})
                                                                        .then(function(){
                                                                            res.send(true)
                                                                        })
                                                                }
                                                            }
                                                        })
                                                }
                                            }

                                        }
                                    })
                            })

                    })
            })
    }
}
//项目评审结果审核
exports.reviewVerify = function (req,res,next) {
    var id = req.body.id
    var key = req.body.key
    console.log("id",id)
    console.log("key",key)
    var can
    if(key == 1){ //确定结果
        Project.update({_id:id},{$set:{status:4}}) //把项目状态更新为用户缴纳凭证状态
            .then(function(){
                Project.PfindOne({_id:id})
                    .then(function(project) {
                        var result = project.result //报名用户的评审结果
                        var name = project.name //项目名称
                        var mode = project.mode
                        result.sort(function(a,b){
                            return b.avScore-a.avScore});
                        console.log("result",result)
                        var user1 = result[0].enterprise
                        console.log("user1",user1)
                     /*   var user2 = result[1].enterprise*/
                        User.PfindOne({enterprise:user1})
                            .then(function(doc){
                                //获取第一名openid
                                var name1 = doc.name
                                var openid1 = doc.openid
                                console.log("openid1",openid1)
                                //获取所有报名该项目的公司信息
                                User.find({"project":{$elemMatch:{"name":name}}})
                                    .then(function(bmUser){
                                        console.log("bmUser",bmUser)
                                        var pro
                                        for(var i = 0;i < bmUser.length;i++){
                                            console.log("openid",bmUser[i].openid)
                                            var project = bmUser[i].project
                                            console.log("project1",project)
                                            if(bmUser[i].openid == openid1){
                                                //更新第一名的项目结果为成功
                                                for(var j = 0;j < project.length;j++){
                                                    if(project[j].name == name){
                                                        console.log("name",name)
                                                        console.log("name2",project[j].name)
                                                        project[j].result = [2,moment(new Date()).format('LL')]
                                                        console.log("pro",project)
                                                        User.update({"openid":openid1},{$set:{"project":project}})
                                                            .then(function(){
                                                                //给第一名推送消息
                                                                var templateId = global.WEIXIN_TEMPLATE_ID
                                                                var cur = new Date()
                                                                var t = new Date((cur/1000+60*60*24*5)*1000)
                                                                var url = ""
                                                                data = {
                                                                    "first": {
                                                                        "value": "您的竞标结果已公布",
                                                                        "color": "#173177"
                                                                    },
                                                                    "keyword1": {
                                                                        "value":name ,
                                                                        "color": "#173177"
                                                                    },
                                                                    "keyword2": {
                                                                        "value":name1,
                                                                        "color": "#173177"
                                                                    },
                                                                    "keyword3": {
                                                                        "value":"竞标成功",
                                                                        "color": "#173177"
                                                                    },
                                                                    "remark": {
                                                                        "value": "请在"+moment(new Date(t)).format('YYYY-MM-DD HH:mm:ss')+"前上传缴纳凭证，否则此次结果失效",
                                                                        "color": "#173177"
                                                                    }
                                                                }
                                                                api.sendTemplate(openid1, templateId, url, data, function (err, result) {
                                                                    if (!err) {
                                                                        schedule.scheduleJob(t, function(){
                                                                            console.log('scheduleCronstyle:' + new Date());
                                                                            User.PfindOne({"voucher":{$elemMatch:{"project":name}}})
                                                                                .then(function(vou){
                                                                                    console.log("vou",vou)
                                                                                    if(!vou){

                                                                                        Project.update({_id:id},{$set:{status:6}}) //把项目状态更新为上传超时状态
                                                                                            .then(function () {
                                                                                                console.log("update project status overtime")
                                                                                                User.PfindOne({openid:openid1})
                                                                                                    .then(function(u){
                                                                                                        console.log("u",u)
                                                                                                        var p1 = u.project
                                                                                                        for(var x in p1){
                                                                                                            if(p1[x].name == name){
                                                                                                                p1[x].result[0] = -2
                                                                                                                p1[x].result[1] = moment(new Date()).format('LL')
                                                                                                                User.update({"openid":openid1},{$set:{"project":p1}})
                                                                                                                    .then(function(){
                                                                                                                      console.log("upload overtime")
                                                                                                                    })
                                                                                                            }
                                                                                                        }
                                                                                                    })
                                                                                            })

                                                                                    }else{
                                                                                        console.log("not need update")
                                                                                    }
                                                                                })
                                                                        })
                                                                        console.log(result)

                                                                    } else {
                                                                        console.log("eeeeeeeeeeeee")
                                                                        console.log(err)
                                                                    }
                                                                })
                                                            })
                                                    }
                                                }

                                            }else if(bmUser[i].openid != openid1){
                                                //更新竞标失败的用户的项目结果为失败
                                                for(var k = 0;k < project.length;k++){
                                                    if(project[k].name == name){
                                                        project[k].result[0] = -3
                                                        project[k].result[1] = moment(new Date()).format('LL')
                                                        console.log("erruser",project)
                                                        console.log("bmUser[i].openid",bmUser[i].openid)

                                                                console.log("222222222222")
                                                                console.log("bmUser[i].openid222222",bmUser[i].openid)
                                                                //给所有竞标失败者推送消息
                                                                var templateId = global.WEIXIN_TEMPLATE_ID
                                                                var url =  ""
                                                                var cur = new Date()
                                                                var t = new Date((cur/1000+60*60*24*5)*1000)
                                                                User.PfindOne({"openid":bmUser[i].openid})
                                                                    .then(function(failUser){
                                                                        data = {
                                                                                        "first": {
                                                                                            "value": "您的竞标结果已公布",
                                                                                            "color": "#173177"
                                                                                        },
                                                                                        "keyword1": {
                                                                                            "value":name ,
                                                                                            "color": "#173177"
                                                                                        },
                                                                                        "keyword2": {
                                                                                            "value":failUser.name,
                                                                                            "color": "#173177"
                                                                                        },
                                                                                        "keyword3": {
                                                                                            "value":"竞标失败",
                                                                                            "color": "#173177"
                                                                                        },
                                                                                        "remark": {
                                                                                            "value": "您未能通过该项目的竞标，请下次努力",
                                                                                            "color": "#173177"
                                                                                        }
                                                                                    }
                                                                        api.sendTemplate(failUser.openid, templateId, url, data, function (err, result) {
                                                                            if (!err) {
                                                                                console.log("failUser.openid",failUser.openid)
                                                                                console.log("project",project)
                                                                                User.update({"openid":failUser.openid},{$set:{"project":project}})
                                                                                 .then(function(){
                                                                                     console.log(" failUser update success!")
                                                                                     console.log(result)
                                                                                 })

                                                                            } else {
                                                                                console.log(err)
                                                                            }
                                                                        })
                                                                    })


                                                    }
                                                }
                                            }
                                        }
                                        res.send(true)
                                    })
                               /* User.PfindOne({enterprise:user2})
                                    .then(function(doc2){
                                        var openid2 = doc2.openid
                                        var templateId = global.WEIXIN_TEMPLATE_ID
                                        var url =  "/"
                                        data = {
                                            "first": {
                                                "value": "操作人员通过系统生成获取了方案",
                                                "color": "#173177"
                                            },
                                            "keyword1": {
                                                "value":11111111 ,
                                                "color": "#173177"
                                            },
                                            "keyword2": {
                                                "value":2222222222,
                                                "color": "#173177"
                                            },
                                            "keyword3": {
                                                "value": moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                                                "color": "#173177"
                                            },
                                            "remark": {
                                                "value": "请登录系统查看详情",
                                                "color": "#173177"
                                            }
                                        }
                                        api.sendTemplate(openid1, templateId, url, data, function (err, result) {
                                            if (!err) {
                                                console.log(result)
                                            } else {
                                                console.log(err)
                                            }
                                        })
                                    })*/
                            })
                    })
            })
    }else if(key == 0){
        Project.PfindOne({_id:id})
            .then(function(doc){
                var judge = doc.judge[0]
                Project.update({_id:id},{$pull:{'judge':{}}})
                    .then(function(){
                        Project.update({_id:id},{$pull:{'score':{}}})
                            .then(function(){
                                Project.update({_id:id},{$pull:{'result':{}}})
                                    .then(function(){
                                        var cur = new Date()
                                        var t = new Date((cur/1000+60*60*24*5)*1000)
                                        console.log(t)
                                        Project.update({_id:id},{$set:{status:0,time:moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),update_time:moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),enable_time:moment(t).format('YYYY-MM-DD HH:mm:ss')}})
                                            .then(function(){
                                                res.send(true)
                                            })
                                    })
                            })
                    })
            })
    }

}

//是否递补
exports.reviewContinue = function (req,res,next) {
    var id = req.body.id
    var key = req.body.key
    console.log("id",id)
    console.log("key",key)
    if(key == 1) { //递补
        Project.PfindOne({_id:id})
            .then(function(project) {
                var result = project.result //报名用户的评审结果
                var name = project.name //项目名称
                result.sort(function (a, b) {
                    return b.avScore - a.avScore
                });
                console.log("result", result)
                var user2 = result[1].enterprise
                console.log("user2", user2)
                User.PfindOne({enterprise:user2})
                    .then(function(doc) {
                        //获取第二名openid
                        var name2 = doc.name
                        var openid2 = doc.openid
                        console.log("openid2", openid2)
                        var project = doc.project
                        for(var j in project){
                            if(project[j].name == name){
                                project[j].result[0] = 2
                                project[j].result[1] = moment(new Date()).format('LL')
                                User.update({"openid":openid2},{$set:{"project":project}})
                                    .then(function(){
                                        //给第二名推送消息
                                        var templateId = global.WEIXIN_TEMPLATE_ID
                                        var cur = new Date()
                                        var t = new Date((cur/1000+60*60*24*5)*1000)
                                        var url = ""
                                        data = {
                                            "first": {
                                                "value": "您的竞标结果已公布",
                                                "color": "#173177"
                                            },
                                            "keyword1": {
                                                "value":name ,
                                                "color": "#173177"
                                            },
                                            "keyword2": {
                                                "value":name2,
                                                "color": "#173177"
                                            },
                                            "keyword3": {
                                                "value":"竞标成功",
                                                "color": "#173177"
                                            },
                                            "remark": {
                                                "value": "请在"+moment(new Date(t)).format('YYYY-MM-DD HH:mm:ss')+"前上传缴纳凭证，否则此次结果失效",
                                                "color": "#173177"
                                            }
                                        }
                                        api.sendTemplate(openid2, templateId, url, data, function (err, result) {
                                            if (!err) {
                                                schedule.scheduleJob(t, function(){
                                                    console.log('scheduleCronstyle:' + new Date());
                                                    User.PfindOne({"voucher":{$elemMatch:{"project":name}}})
                                                        .then(function(vou){
                                                            console.log("vou",vou)
                                                            if(!vou){
                                                                var cur = new Date()
                                                                var t = new Date((cur/1000+60*60*24*5)*1000)
                                                                Project.update({_id:id},{$set:{status:1,score:[],result:[],review_time:"",judge:[],enable_time:moment(t).format('YYYY-MM-DD HH:mm:ss')}}) //把项目状态更新为重新报名状态
                                                                    .then(function(doc){
                                                                        schedule.scheduleJob(t, function(){
                                                                            console.log('scheduleCronstyle:' + new Date());
                                                                            Project.update({_id:id},{$set:{status:0}})
                                                                                .then(function(doc3){
                                                                                    console.log("update project")
                                                                                })
                                                                        })
                                                                        console.log("update project status restart")
                                                                        User.find({"project":{$elemMatch:{"name":name}}})
                                                                            .then(function(bmUser){
                                                                                console.log("bmUser",bmUser)
                                                                                for(var n in bmUser){
                                                                                    var p1 = bmUser[n].project
                                                                                    for(var x in p1){
                                                                                        if(p1[x].name == name){
                                                                                            p1[x].result[0] = -4
                                                                                            p1[x].result[1] = moment(new Date()).format('LL')
                                                                                            User.update({"openid":bmUser[n].openid},{$set:{"project":p1}})
                                                                                                .then(function(){
                                                                                                    console.log("upload overtime")
                                                                                                })
                                                                                        }
                                                                                    }
                                                                                }

                                                                            })
                                                                        res.send(true)
                                                                    })
                                                            }else{
                                                                console.log("not need update")
                                                            }
                                                        })
                                                })
                                                console.log(result)

                                            } else {
                                                console.log(err)
                                            }
                                        })
                                        res.send(true)
                                    })
                            }
                        }

                    })
            })
    }else if(key == 0){//项目重新报名
        var cur = new Date()
        var t = new Date((cur/1000+60*60*24*5)*1000)
        Project.PfindOne({_id:id})
            .then(function(project){
                var name = project.name //项目名称
                Project.update({_id:id},{$set:{status:1,score:[],result:[],review_time:"",judge:[],enable_time:moment(t).format('YYYY-MM-DD HH:mm:ss')}}) //把项目状态更新为重新报名状态
                    .then(function(doc){
                        schedule.scheduleJob(t, function(){
                            console.log('scheduleCronstyle:' + new Date());
                            Project.update({_id:id},{$set:{status:0}})
                                .then(function(doc3){
                                    console.log("update project")
                                })
                        })
                        console.log("update project status restart")
                        User.find({"project":{$elemMatch:{"name":name}}})
                            .then(function(bmUser){
                                console.log("bmUser",bmUser)
                                for(var n in bmUser){
                                    var p1 = bmUser[n].project
                                    for(var x in p1){
                                        if(p1[x].name == name){
                                            p1[x].result[0] = -4
                                            p1[x].result[1] = moment(new Date()).format('LL')
                                            User.update({"openid":bmUser[n].openid},{$set:{"project":p1}})
                                                .then(function(){
                                                    console.log("upload overtime")
                                                })
                                        }
                                    }
                                }

                            })
                        res.send(true)
                    })
            })

    }
}
//项目列表逻辑
exports.projectLogic = function (req,res,next) {
    Project.find({}).sort({status:1})
        .then(function(doc){
            var length = JSON.stringify(doc.length)
            Project.find({}).sort({status:1}).limit(10)
                .then(function(doc2){
                    var options = {
                        length:length,
                        projects:JSON.stringify(doc2),
                    }
                    res.go("/backend/admin/projects",options)
                })
        })
}
//项目报名名单逻辑
exports.bcompanLogic = function (req,res,next) {
   var project = req.query.project
    console.log(project)
    Project.PfindOne({name:project})
        .then(function(doc){
            var user = doc.account
            var length = JSON.stringify(user.length)
            console.log(length)
            var options = {
                project:project,
                users:JSON.stringify(user)
            }
            res.go("/backend/admin/bcompans",options)
        })
}
//导出项目报名名单
exports.companExport = function (req,res,next) {
    console.log("导出报名用户excel数据")
    var project = req.query.project
    console.log("user",project)
    Project.PfindOne({name:project})
        .then(function(doc){
            if(!doc || doc.length == 0){
                console.log("数据不存在")
            } else {
                var user = doc.account
                console.log(user)
                console.log(user.length)
                var conf ={};
                conf.name = "Sheet1";
                conf.cols =[{
                    caption:'公司全称',
                    type:'string'
                },{
                    caption:'地址',
                    type:'string'
                },{
                    caption:'联系人',
                    type:'string'
                },{
                    caption:'联系电话',
                    type:'string'
                },{
                    caption:'联系邮箱',
                    type:'string'
                }]
                var rows =new Array()
                for(var i=0;i<user.length;i++) {
                    rows.push([user[i].enterprise,user[i].address,user[i].name,user[i].tel,user[i].email]);
                }
                conf.rows=rows
                var result = nodeExcel.execute(conf);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats');
                res.setHeader("Content-Disposition", "attachment; filename=" + "enterprise.xlsx");
                res.end(result, 'binary');
            }
        })
        .catch(function(err){
            console.log(err)
        })
}
//项目报名列表逻辑
exports.applyLogic = function (req,res,next) {
    Project.find({}).sort({status:1})
        .then(function(doc){
            var length = JSON.stringify(doc.length)
            Project.find({}).sort({status:-1}).limit(10)
                .then(function(doc2){
                    var options = {
                        length:length,
                        projects:JSON.stringify(doc2),
                    }
                    console.log(doc2)
                    res.go("/backend/admin/applys",options)
                })
        })
}
//项目评审结果页面逻辑
exports.resultLogic = function (req,res,next) {
    var project = req.query.project
    console.log(project)
    Project.PfindOne({name:project})
        .then(function(doc){
            var user = doc.account
            var length = JSON.stringify(user.length)
            var mode = doc.mode
            console.log(length)
            var options = {
                name:project,
                judge:JSON.stringify(doc.judge),
                result:JSON.stringify(doc.result),
                length:length,
                mode:mode
            }
            res.go("/backend/admin/result",options)
        })
}
//增加或更新
exports.projectAdd = function(req,res,next){
    var name = req.body.name
    var estimated = req.body.estimated
    var content = req.body.content
    var quality_level = req.body.quality_level
    var technical_standard = req.body.technical_standard
    var project_duration = req.body.project_duration
    var server_duration = req.body.server_duration
    var select_num = req.body.select_num
    var security_deposit = req.body.security_deposit
    var commission = req.body.commission
    var id = req.body.id
    var admin_username = req.body.username
    var enable_time = req.body.enable_time
    var username = req.session.username
    console.log("enable",enable_time)
    req.session.notice = name+"启动"
    console.log("session_notice>>>>>",req.session.notice)
    req.session.project = name
    console.log("session>>>>>",req.session.project)

    var insert = {name:name,estimated:estimated,content:content,quality_level:quality_level,technical_standard:technical_standard,project_duration:project_duration,server_duration:server_duration,select_num:select_num,security_deposit:security_deposit,commission:commission,number:0,status:1,time:moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),update_time:moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),enable_time:moment(enable_time).format('YYYY-MM-DD HH:mm:ss')}
    var update = {name:name,estimated:estimated,content:content,quality_level:quality_level,technical_standard:technical_standard,project_duration:project_duration,server_duration:server_duration,select_num:select_num,security_deposit:security_deposit,commission:commission,update_time:moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),enable_time:moment(enable_time).format('YYYY-MM-DD HH:mm:ss')}
    var notice_insert = {name:name+"启动",project:name,admin_username:admin_username,time:moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),update_time:moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),admin_id:username}
    console.log("id>>>>",id)
    console.log("name>>>>>>>>>>>",name)
    if(id != "" && id != null && id != undefined){
        Project.PfindOneAndUpdate({_id:id},{$set:update}).then(function (doc) {
            schedule.scheduleJob(enable_time, function(){
                console.log('scheduleCronstyle:' + new Date());
                Project.update({name:name},{$set:{status:0}})
                    .then(function(doc3){
                        console.log("update project")
                    })
            });
            res.send(true)
        })
            .catch(function(err){
                console.log(err)
            })
    }else {
        Project.Pinsert(insert)
            .then(function (doc) {
                Notice.Pinsert(notice_insert)
                    .then(function(doc2){
                        schedule.scheduleJob(enable_time, function(){
                            console.log('scheduleCronstyle:' + new Date());
                            Project.update({name:name},{$set:{status:0}})
                                .then(function(doc3){
                                    console.log("update project")
                                })
                        });
                        res.send(true)
                    })
            })
    }
}
//更新评委
exports.judgeUpdate = function (req,res,next) {
    var judge = []
    var user1 = req.body.user1
    var user2 = req.body.user2
    var user3 = req.body.user3
    var tel1 = req.body.tel1
    var tel2 = req.body.tel2
    var tel3 = req.body.tel3
    var password1 = req.body.password1
    var password2 = req.body.password2
    var password3 = req.body.password3
    var id = req.body.id
    judge.push(user1,user2,user3)
    console.log("judge",judge)
    Project.update({_id:id},{$push:{judge:{name:user1,tel:tel1,password:password1}}})
        .then(function(doc){
            Project.update({_id:id},{$push:{judge:{name:user2,tel:tel2,password:password2}}})
                .then(function(){
                    Project.update({_id:id},{$push:{judge:{name:user3,tel:tel3,password:password3}}})
                        .then(function(){

                                    Judge.update({name:user1},{$set:{judge_status:2,password:password1}})
                                        .then(function(){
                                            Judge.update({name:user2},{$set:{judge_status:2,password:password2}})
                                                .then(function(){
                                                    Judge.update({name:user3},{$set:{judge_status:2,password:password3}})
                                                        .then(function(){

                                                            Judge.update({$or: [{name:user1}, {name:user2},{name:user3}]},{$push:{"project":{project_id:id,time:moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),status:'going'}}},{multi:true})
                                                             .then(function(doc){
                                                               res.send(true)
                                                             })
                                                        })
                                                })
                                        })

                        })
                })
        })
        .catch(function(){
            res.send(true)
        })
}

exports.setTemplateView =function (req,res,next) {
    var project = req.query.project
    console.log("project",project)
    var options = {
        project:project
    }
    res.go("/backend/admin/scoring",options)
}
//设置评审模板
exports.setTemplate =function (req,res,next) {
    var t1 = req.body.t1
    var t2 = req.body.t2
    var t3 = req.body.t3
    var t4 = req.body.t4
    var t5 = req.body.t5
    var t6 = req.body.t6
    var t7 = req.body.t7
    var t8 = req.body.t8
    var c1 = req.body.c1
    var c2 = req.body.c2
    var c3 = req.body.c3
    var c4 = req.body.c4
    var c5 = req.body.c5
    var c6 = req.body.c6
    var c7 = req.body.c7
    var c8 = req.body.c8
    var s1 = req.body.s1
    var s2 = req.body.s2
    var s3 = req.body.s3
    var s4 = req.body.s4
    var s5 = req.body.s5
    var s6 = req.body.s6
    var s7 = req.body.s7
    var s8 = req.body.s8
    var part1 = req.body.part1
    var part2 = req.body.part2
    var address = req.body.address
    var project = req.body.project
    var mode = req.body.mode
    if(mode == "mode1"){
        Project.update({name:project},{$addToSet:{'template':{address:address,part1:part1,part2:part2,t1:t1,t2:t2,t3:t3,t4:t4,t5:t5,t6:t6,t7:t7,t8:t8,c1:c1,c2:c2,c3:c3,c4:c4,c5:c5,c6:c6,c7:c7,c8:c8,s1:s1,s2:s2,s3:s3,s4:s4,s5:s5,s6:s6,s7:s7,s8:s8}}})
            .then(function(doc){
                Project.update({name:project},{$set:{mode:mode}})
                    .then(function(){
                        res.send(true)
                    })
            })
    }else if(mode == "mode2"){
        Project.update({name:project},{$addToSet:{'template':{address:address}}})
            .then(function(doc){
                Project.update({name:project},{$set:{mode:mode}})
                    .then(function(){
                        res.send(true)
                    })
            })
    }

}
//评分
exports.saveScore = function (req,res,next) {
    var score = req.body.score
    var name = req.body.name
    var judge = req.session.username
    console.log(score)
    Project.update({name:name},{$push:{'score':{judge:judge,result:JSON.parse(score)}}})
        .then(function(){
            Judge.update({name:judge},{$set:{judge_status:3}})
                .then(function(){
                    Project.PfindOne({name:name})
                        .then(function(doc){
                            var length = doc.score.length
                            console.log("length",length)
                            if(length == 3){
                                var a = doc.score[0].result
                                var b = doc.score[1].result
                                var c = doc.score[2].result
                                Project.update({name:name},{$set:{status:3,review_time:moment(new Date()).format('YYYY-MM-DD')}})
                                    .then(function(){
                                        var score = []
                                        for(var i=0;i<a.length;i++){
                                            for(var j = 0;j<3;j++){
                                                score.push(doc.score[j].result[i].score)
                                                console.log("score",score)
                                                if(score.length == 3){
                                                    var average = parseFloat((a[i].score + b[i].score +c[i].score)/3).toFixed(1)
                                                    console.log(average)
                                                    console.log("score",score)
                                                    Project.update({name:name},{$push:{'result':{'enterprise':a[i].enterprise,'score':score,'avScore':average}}})
                                                        .then(function(){
                                                            console.log("update success!")
                                                        })
                                                    score.splice(0,score.length);
                                                }
                                            }

                                        }

                                        res.send(true)
                                    })
                            }
                            else{
                                res.send(true)
                            }
                        })
                })
        })
}

exports.projectValidate = function (req,res,next) {
    var project = req.query.name
    console.log("project:"+project)
    Project.PfindOne({name:project})
        .then(function(doc){
            if(doc){
                res.send("false")
            }else{
                res.send("true")
            }
        })
}
//查询项目
exports.projectSearch = function (req,res,next) {
    var project = req.body.project
    Project.find({name:eval('/'+project+'.*/i')}).sort({update_time:-1})
        .then(function (doc) {
            res.send(doc)
        })
}
//取消项目
exports.projectCancel = function (req,res,next) {
    var id = req.body.id
    var remark = req.body.remark

    Project.update({_id:id},{$set:{status:8,remark:remark}})
        .then(function () {
            Project.PfindOne({_id:id})
                .then(function(doc){
                    var name = "由于"+remark+"原因，故取消"+doc.name
                    var insert = {name:name,project:doc.name,time:moment(new Date()).format('YYYY-MM-DD'),update_time:moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),admin_id:"system"}
                    Notice.Pinsert(insert)
                        .then(function(){
                            res.send(true)
                        })
                })
        })
}
//删除项目信息
exports.projectDelete = function (req,res,next) {
    var ids = req.body.ids
    var _ids=ids.split(",")
    console.log(_ids)
    console.log(ids)
    for(var i = 0;i<_ids.length;i++){
        Project.PdeleteById(_ids[i])
    }
    res.send(true)
}

//渲染编辑页面
exports.projectEdit = function (req, res, next) {
    var id = req.body.id
    console.log("id>>>>",id)
    Project.PfindOne({_id:id})
        .then(function(doc){
            console.log("doc",doc)
            res.send(doc)
        })
        .catch(function(err){
            console.log(err)
        })
}

exports.projectAddView = function(req,res,next){
    var options = {

    }
    res.go("/backend/admin/project-add",options)
}

//导出项目报名企业列表
exports.commpanExport = function (req,res,next) {
    console.log("导出企业excel数据")
    User.find({USER_STATUS:1})
        .then(function(doc){
            if(!doc || doc.length == 0){
                console.log("数据不存在")
            } else {
                console.log(doc.length)
                var conf ={};
                conf.name = "Sheet1";
                conf.cols =[{
                    caption:'序号',
                    type:'Number'
                },{
                    caption:'公司全称',
                    type:'string'
                },{
                    caption:'联系人',
                    type:'string'
                },{
                    caption:'联系电话',
                    type:'string'
                },{
                    caption:'联系邮箱',
                    type:'string'
                }]
                var rows =new Array()
                for(var i=0;i<doc.length;i++) {
                    rows.push([doc[i].name,doc[i].number,doc[i].tel,doc[i].relevance,doc[i].department]);
                }
                conf.rows=rows
                var result = nodeExcel.execute(conf);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats');
                res.setHeader("Content-Disposition", "attachment; filename=" + "专家名单.xlsx");
                res.end(result, 'binary');
            }
        })
        .catch(function(err){
            console.log(err)
        })
}

