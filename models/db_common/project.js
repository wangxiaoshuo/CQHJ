/**
 * Created by Administrator on 2017/8/15.
 */
'use strict';

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var P = require('bluebird')
var _ = require('lodash')

var projectSchema = Schema({
    //报名用户
    account:[{_id:false,openid:String,material:Array,enterprise:String,name:String,tel:String,email:String,address:String,progress:Array,result:Array}],
    //项目名称
    name:{
        type:String,
        require:true
    },
    remark:{
      type:String
    },
    //评委 status 1 缺席 2 正常
    judge:[{_id:false,name:String,tel:String,password:String,remark:String,status:String}],
    score:[{_id:false,judge:String,result:Array}],
    //审核结果
    result:[{_id:false,enterprise:String,score:Array,avScore:Number}],
    //报名人数
    number:{
        type:Number,
    },
    //评委评审模板
    template:[{_id:false,address:String,part1:String,part2:String,t1:String,t2:String,t3:String,t4:String,t5:String,t6:String,t7:String,t8:String,c1:String,c2:String,c3:String,c4:String,c5:String,c6:String,c7:String,c8:String,s1:Number,s2:Number,s3:Number,s4:Number,s5:Number,s6:Number,s7:Number,s8:Number}],
    //项目状态 报名中 待审核 审核中 结果待确认 已成功
    status:{
        type:Number,
    },
    //缴纳凭证
    voucher:[{_id:false,path:String}],
    //材料 存放项目资料的地址
    material:[{_id:false,name:String,url:String}],
    //预估规模
    estimated:{
      type:String
    },
    //拆迁还建内容
    content:{
        type:String
    },
    //质量标准要求
    quality_level:{
      type:String
    },
    //技术标准要求
    technical_standard:{
      type:String
    },
    //计划工期(含拆迁工期、还建工期)
    project_duration:{
        type:String
    },
    //服务期限
    server_duration:{
      type:String
    },
    //选定应答人数量
    select_num:{
        type:Number
    },
    //保证金
    security_deposit:{
        type:Number
    },
    //佣金
    commission:{
        type:String
    },
    //报名时间
    enable_time:{
      type:String,
    },
    //评审时间
    review_time:{
        type:String,
    },
    //发布时间
    time:{
        type:String
    },
    //更新时间
    update_time:{
        type:String
    },
    mode:{
        type:String
    }
})

require('../base/schema.js')(projectSchema)
projectSchema.static.Pinsert = function (doc) {
    return this.Pinsert(doc)
}

module.exports = projectSchema