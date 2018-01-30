/**
 * Created by Administrator on 2017/8/10.
 */
'use strict';

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var P = require('bluebird')
var _ = require('lodash')

var userSchema = Schema({
    openid:{
        type:String,
        default: "",
        index: true
    },
    //微信头像
    tx:{
      type:String
    },
    //联系人
    name:{
      type:String
    },
    //纳税人识别号
    number: {
        type:String,
    },
    //登记公司名称
    enterprise:{
        type:String,
    },
    address:{
        type:String
    },
    email:{
        type:String
    },
    password: {
        type:String,
        default:"123456"
    },
    tel:{
        type:String
    },
    //基本账号名
    base_account:{
        type:String
    },
    //开户账号
    account:{
        type:String
    },
    //银行
    bank:{
      type:String
    },
    //TODO 账号
    //营业执照
    business_licences:{
      type:Array
    },
    //缴纳凭证
    voucher:[{_id:false,project:String,name:String,url:String}],
    //应答材料
    material:[{_id:false,name:String,url:String}],
    //用户状态(已审核、待审核、未通过)
    user_status:{
        type:Number,
        default:global.USER_STATUS.examine,
        index:true
    },
    //用户角色
    user_role:{
        type:Number,
        default:global.ACCOUNT_ROLE.user
    },
    //用户报名的项目 进度 1 已报名 2 竞标成功 3 竞标失败
    project:[{_id:false,name:String,material:Array,progress:Array,result:Array,bm_time:String}],
    registerTime:{
        type:String,
        index:true
    },
})

require('../base/schema.js')(userSchema)
userSchema.statics.PfindByEmail = function (email) {
    return this.PfindOne({email:email})
}
userSchema.statics.PfindByEnterprise = function (enterprise) {
    return this.PfindOne({enterprise:enterprise})
}
userSchema.statics.PaddOrUpdate = function (options) {
    var query = {enterprise: options.enterprise}
    var thisModel = this
    return this.findOne(query)
        .then(function (doc) {
            // 新增 或者 覆盖
            if (!doc || doc.length === 0) {
                return thisModel.create(options)
                    .then(function (doc) {
                        doc.add = true
                        return doc
                    })
            } else {
                delete options._id
                return thisModel.update(query, {$set: options})
                    .then(function (doc) {
                        doc.add = false
                        return doc
                    })
            }
        })
}
userSchema.statics.Padd = function (options) {
    var thisModel = this
    return this.Pfind({enterprise: options.enterprise})
        .then(function (doc) {
            if (!doc || doc.length === 0) {
                var op = {
                    time: new Date(Date.now())
                }
                _.extend(options, op)
                return thisModel.Psave(options)
            } else {
                return P.reject(new Error('账号已经存在, 请与管理员联系'))
            }
        })
}
userSchema.statics.Pupdate = function (id, options) {
    return this.PfindOneAndUpdate({_id: id}, {$set: options})
}
userSchema.static.PfindByUserStatus = function (options) {
    return this.find(options)
        .then(function(doc){
            if(doc){
                console.log("doc",doc)
            }
        })
        .catch(function(err){
            console.log(err)
        })
}
userSchema.static.Pinsert = function (doc) {
    return this.Pinsert(doc)
}

module.exports = userSchema