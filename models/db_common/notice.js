/**
 * Created by Administrator on 2017/8/29.
 */
/**
 * Created by Administrator on 2017/8/15.
 */
'use strict';

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var P = require('bluebird')
var _ = require('lodash')

var noticeSchema = Schema({
    //所属项目
    project:{
        type:String
    },
    //公告标题
    name:{
        type:String,
        require:true
    },
    //材料 存放项目资料的地址
    material:[{_id:false,name:String,url:String}],
    //发布时间
    time:{
        type:String
    },
    //更新时间
    update_time:{
        type:String
    },
    //发布者
    admin_id:{
      type:String
    }
})

require('../base/schema.js')(noticeSchema)
noticeSchema.static.Pinsert = function (doc) {
    return this.Pinsert(doc)
}

module.exports = noticeSchema