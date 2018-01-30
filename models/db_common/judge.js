/**
 * Created by Administrator on 2017/8/10.
 */
'use strict';

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var P = require('bluebird')
var _ = require('lodash')

var judgeSchema = Schema({
    openId:{
        type:String,
        default: "",
        index: true
    },
    name:{
      type:String
    },
    project:[{_id:false,project_id:String,time:String,status:String}],
    password:{
      type:String,
    },
    //头像
    tx:{
      type:String
    },
    //备注
    remark:{
      type:String
    },
    //证书编号
    number: {
        type:String
    },
    tel:{
        type:String
    },
    //关联专业
    relevance:{
        type:String
    },
    //公司部门
    department: {
        type: String
    },
   //评委状态 空闲状态3 审核状态2 忙碌状态 1
     judge_status:{
     type:Number,
     },
    //角色
    judge_role:{
        type:Number,
        default:1
    }
})

require('../base/schema.js')(judgeSchema)
judgeSchema.statics.PaddOrUpdate = function (options,query) {
    var query = query
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


module.exports = judgeSchema