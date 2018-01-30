/**
 * Created by Administrator on 2017/8/10.
 */
var mongoose = require("mongoose")
var User = mongoose.models.user
var Notice = mongoose.models.notice
var Project = mongoose.models.project
var Account = mongoose.models.account
var Models = require("../models/models.js")
var Config = require('../config.js')
var Constant = Config['Constant'] || {}
var template = require('./lib/template.js')
var md5 = require("blueimp-md5").md5
var _ = require("lodash")
var moment = require("moment")
moment.locale('zh-cn')
var P = require("bluebird")
var Util = require("../lib/util.js")
var Path = require("path")
var json = {state: -1, message: '操作失败', data: {}}

//渲染编辑页面
exports.companEdit = function (req, res, next) {
    var id = req.body.id
    console.log("id>>>>",id)
        User.PfindOne({_id:id})
            .then(function(doc){
                res.send(doc)
            })
            .catch(function(err){
                console.log(err)
            })
}
exports.companAddView = function(req,res,next){
    var options = {

    }
    res.go("/backend/admin/compan-add",options)
}

//增加或更新
exports.companAdd = function(req,res,next){
    var id = req.body.id
    var name = req.body.name
    var tel = req.body.tel
    var email = req.body.email
    var address = req.body.address
    var enterprise = req.body.enterprise
    var number = req.body.number
    var base_account = req.body.base_account
    var bank = req.body.bank
    var account = req.body.account
    var kind = req.body.kind
    var openid = req.session.openid
    var tx = req.session.headimgurl
    console.log(id)
    console.log("openid",openid)
    if(id != null && id != "" && id != undefined){
        User.PfindOneAndUpdate({_id:id},{$set:{name:name,tel:tel,email:email,address:address,enterprise:enterprise,number:number,base_account:base_account,bank:bank,account:account}}).then(function (doc) {
            res.send(true)
        })
            .catch(function(err){
                console.log(err)
            })
    }else {
        User.Pinsert({
            openid:openid,
            tx:tx,
            name: name,
            tel: tel,
            email: email,
            address: address,
            enterprise: enterprise,
            number: number,
            base_account: base_account,
            bank: bank,
            account: account,
            registerTime:moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            role: 0,
            user_status: 2
        })
            .then(function (doc) {
                req.session.role = 0
                req.session.kind = kind
                req.session.compan = enterprise
                console.log("enterprise", req.session.compan)
                res.send(true)
            })
    }
}

//用户列表逻辑
exports.companLogic = function (req,res,next) {
    User.find({}).sort({user_status:-1})
        .then(function(doc){
            var length = JSON.stringify(doc.length)
            User.find({}).sort({user_status:-1}).limit(10)
                .then(function(doc2){
                    var options = {
                        length:length,
                        users:JSON.stringify(doc2),
                        musers:doc
                    }
                    res.go("/backend/admin/compans",options)
                })
        })
}

//查看公司信息
exports.companShowView = function (req, res, next) {
    var enterprise = req.query.enterprise
    User.PfindOne({enterprise:enterprise})
        .then(function(doc){
            var name = doc.name
            var tel = doc.tel
            var email = doc.email
            var address = doc.address
            var time = doc.registerTime
            var tx = doc.tx
            console.log("time",time)
            var options = {
               data:doc
            }
            res.go('/backend/admin/compan-show', options)
        })

}

//删除公司信息
exports.companDelete = function (req,res,next) {
    var ids = req.body.ids
    var _ids=ids.split(",")
    console.log(_ids)
    console.log(ids)
    for(var i = 0;i<_ids.length;i++){
        User.PdeleteById(_ids[i])
    }
    res.send(true)
}

//查找公司信息
exports.companSearch =function (req,res,next) {
    var compan = req.body.compan
    var status = req.body.status
    console.log("compan",compan)
    console.log("status",status)
    if(compan != ""){
        User.find({enterprise:eval('/'+compan+'.*/i')}).sort({registerTime:-1})
            .then(function(doc){
                res.send(doc)
            })
    }else if(status != -1){
        User.find({user_status:status}).sort({registerTime:-1})
            .then(function(doc){
                res.send(doc)
            })
    }else if(status == -1){
        User.find({}).sort({user_status:-1})
            .then(function(doc){
                res.send(doc)
            })
    }
}

//审核
exports.companVerify = function (req,res,next) {
    var id = req.body.id
    var key = req.body.key
    if(key == 1){
        User.PfindOneAndUpdate({_id:id},{$set:{user_status:global.USER_STATUS.passed}})
            .then(function(doc){
                res.send(true)
            })
    }else{
        User.PfindOneAndUpdate({_id:id},{$set:{user_status:global.USER_STATUS.refused}})
            .then(function(doc){
                res.send(true)
            })
    }


}

//密码
exports.passwordView = function (req, res, next) {
    var name = req.query.name
    var id = req.query.id
    var enterprise = req.query.enterprise
    console.log("ent",enterprise)
    if(id == 1){
        User.PfindOne({enterprise:enterprise})
            .then(function(doc){
                var name = doc.name
                var id = doc._id
                console.log("id",id)
                var options = {
                    name:name,
                    enterprise:enterprise,
                    id:1
                }
                res.go('/backend/admin/password', options)
            })
    }else{
        var options = {
            name:name,
            id:id
        }
        res.go('/backend/admin/password', options)
    }

}

//重置密码
exports.resetPassword = function(req,res,next){
    var password = req.body.newpassword
    var id = req.body.id
    var enterprise = req.body.enterprise
    console.log("password",password)
    console.log("id",id)
    console.log("enterprise",enterprise)
    if(id == 1){
        User.PfindOneAndUpdate({enterprise:enterprise},{$set:{password:password}})
            .then(function(doc){
                res.send(true)
            })
            .catch(function(err){
                res.send(err)
            })
    }else{
        User.PfindOneAndUpdate({_id:id},{$set:{password:password}})
            .then(function(doc){
                res.send(true)
            })
            .catch(function(err){
                res.send(err)
            })
    }

}

/*后台用户页面*/
//公告列表
exports.afficheView = function(req,res,next){
    Notice.find({}).sort({update_time:-1})
        .then(function(doc){
            var length = JSON.stringify(doc.length)
            Notice.find({}).sort({update_time:-1}).limit(10)
                .then(function(doc2){
                    var options = {
                        length:length,
                        projects:JSON.stringify(doc2),
                    }
                    res.go("/backend/user/affiche_list",options)
                })
        })
}
exports.noticePage = function (req,res,next) {
    var length = req.body.s
    var status = req.body.status
    var compan = req.body.compan
    console.log("status>>>>>",status)
    console.log("c",compan)
    console.log(length)
    Notice.find({}).sort({update_time:-1}).skip(10*(length-1)).limit(10)
        .then(function(doc){
            console.log("length",doc)
            res.send(doc)
        })

}
//可报名项目列表逻辑
exports.bmProjectLogic = function (req,res,next) {
    Project.find({status:1}).sort({update_time:-1})
        .then(function(doc){
            var length = JSON.stringify(doc.length)
            Project.find({status:1}).sort({update_time:-1}).limit(10)
                .then(function(doc2){
                    User.PfindOne({enterprise:req.session.username})
                        .then(function(doc3){
                            var options = {
                                length:length,
                                projects:JSON.stringify(doc2),
                                user_status:doc3.user_status
                            }
                            res.go("/backend/user/project_list",options)
                        })
                })
        })
}
exports.page = function (req,res,next) {
    var length = req.body.s
    var status = req.body.status
    var compan = req.body.compan
    console.log("status>>>>>", status)
    console.log("c", compan)
    Project.find({status:1}).sort({update_time: -1}).skip(10 * (length - 1)).limit(10)
        .then(function (doc) {
            res.send(doc)
        })
}
//项目列表逻辑
exports.projectLogic = function (req,res,next) {
    Project.find({}).sort({update_time:-1})
        .then(function(doc){
            var length = JSON.stringify(doc.length)
            Project.find({}).sort({update_time:-1}).limit(10)
                .then(function(doc2){
                    User.PfindOne({enterprise:req.session.username})
                        .then(function(doc3){
                            var options = {
                                length:length,
                                projects:JSON.stringify(doc2),
                                user_status:doc3.user_status
                            }
                            res.go("/backend/user/project_list",options)
                        })
                })
        })
}
exports.projectPage = function (req,res,next) {
    var length = req.body.s
    var status = req.body.status
    var compan = req.body.compan
    console.log("status>>>>>", status)
    console.log("c", compan)
    Project.find({}).sort({update_time: -1}).skip(10 * (length - 1)).limit(10)
        .then(function (doc) {
            res.send(doc)
        })
}
//查看该项目下的所有公告附件
exports.noticeListShow = function (req,res,next) {
    var name = req.query.name
    Notice.find({project:name})
        .then(function(doc){
            console.log("notice",doc)
            var options = {
                name:name,
                projects:JSON.stringify(doc)
            }
            res.go("/backend/notice",options)
        })
}

exports.uploadMaterial = function (req,res,next) {
    var project = req.query.project
    var kind = req.query.kind
    var options = {
        project:project,
        kind:kind
    }
    res.go("/backend/user/material",options)
}

exports.personView = function(req,res,next){
    var compan = req.session.username
    User.find({enterprise:compan})
        .then(function(doc){
            var b =  doc[0].project.sort(compare('bm_time'))
            var bmProject = b.slice(0,4)
            var options = {
                length:JSON.stringify(doc[0].project.length),
                users:JSON.stringify(doc),
                bm:JSON.stringify(bmProject)
            }
            res.go("/backend/user/person",options)
        })
}
//我报名项目分页
exports.bmProjectPage = function (req,res,next) {
    var start = (req.body.s - 1)*4
    var end = (req.body.s)*4
    var compan = req.session.username
    User.find({enterprise:compan})
        .then(function(doc){
            console.log("doc",doc)
            var b =  doc[0].project.sort(compare('bm_time'))
            console.log("b",b)
            var bmProject = b.slice(start,end)
            console.log(bmProject)
            res.send(bmProject)
        })
}
//报名验证
exports.bmVerify = function (req,res,next) {
    var name = req.body.name
    var username = req.session.username
    var verify = false
    console.log(name)
    console.log(username)
    User.PfindOne({enterprise:username})
        .then(function(doc){
            console.log(doc)
            var project = doc.project
                for(var i in project){
                    if(project[i].name == name){
                        verify = true
                    }
                }
                res.send({verify:verify})
        })
}
//凭证验证
exports.pzVerify = function (req,res,next) {
    var name = req.body.name
    var username = req.session.username
    var verify = false
    console.log(name)
    User.PfindOne({enterprise:username})
        .then(function(doc){
            var voucher = doc.voucher
            for(var i in voucher){
                if(voucher[i].project == name){
                    verify = true
                }
            }
            res.send({verify:verify})
        })
}

function compare(property){
    return function(a,b){
        var value1 = a[property];
        var value2 = b[property];
        return value2-value1;
    }
}

