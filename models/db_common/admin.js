/**
 * Created by Administrator on 2017/8/10.
 */
'use strict';

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var P = require('bluebird')
var _ = require('lodash')

var adminSchema = Schema({
    openId:{
        type:String,
        default: "",
        index: true
    },
    username:{
        type:String,
        unique:true
    },
    password: {
        type:String,
    },
    email:{
        type:String
    },
    name:{
        type:String
    },
    tel:{
        type:String
    },
    admin_role:{
        type:Number,
    },
    registeTime:{
        type:String
    },
    lastTime:{
        type:String
    },
    enable:{
        type:Boolean
    }
})

require('../base/schema.js')(adminSchema)
adminSchema.statics.PfindByEmail = function (email) {
    return this.PfindOne({email:email})
}


adminSchema.statics.Pupdate = function (id, options) {
    return this.PfindOneAndUpdate({_id: id}, {$set: options})
}

adminSchema.statics.Penable = function (id,re) {
    return this.PfindOneAndUpdate({_id: id}, {$set: {enable:re}})
}

module.exports = adminSchema