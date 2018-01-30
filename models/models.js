/**
 * Created by Administrator on 2017/8/11.
 */
'use strict';

var mongoose = require('mongoose')
var fs = require('fs-extra')
var Path = require('path')
var _ = require('lodash')
var P = require('bluebird')

var util = require('../lib/util.js')
var Config = require('../config.js')
var Constant = Config['Constant'] || {}

var DBConnections = []
var CommonDBConnection = null

function initDBInstance(modelsDefinePath,connection,includes,productId){
    var files = fs.readdirSync(util.resolveRelative(__filename,modelsDefinePath))
    var models = []
    files.filter(function(file){
        return /\.js$/.test(file)
    }).forEach(function(file){
        models.push(file.replace(/\.js$/,""))
    })

    models = models.filter(function(file){
        if(includes){
            return _.contains(includes,file)
        }else{
            return true
        }
    })
    if (productId) {
        P.resolve()
            .then(function () {
                return connection(productId)
            })
            .then(function (con) {
                models.forEach(function (model) {
                    var schema = require(Path.join(modelsDefinePath, model))()
                    con.model(model, schema)
                })
            })
    } else {
        models.forEach(function (model) {
            var schema = require(Path.join(modelsDefinePath, model))
            connection.model(model, schema)
        })
    }
}

exports.initDBInstance = initDBInstance

exports.initCommonDB = function (includes) {
    if (!CommonDBConnection) {
        mongoose.Promise = global.Promise;
        CommonDBConnection = mongoose.connect(Constant['MAIN_DB_URI'] + Constant['COMMON_DB_NAME'], {
            // useMongoClient:true,// 加上授权认证时，不可用
            auth: {authdb: Constant['AUTH_DB_NAME']},
            mongos: Constant['MONGOS'],
            auto_reconnect: true,
            poolSize: 10
        })
        DBConnections.push(CommonDBConnection)
        initDBInstance('../models/db_common', CommonDBConnection, includes)
    }
    return CommonDBConnection
}

//数据库断开连接
function gracefulExit(callback) {
    var disconnect = function (db) {
        return new P(function (resolve, reject, notify) {
            db.close(function () {
                console.log('[gracefulExit] 数据库已经断开连接');
                resolve(true)
            })
        })
    }

    var promises = []
    DBConnections.forEach(function (db, idx) {
        if (db) {
            promises.push(disconnect(db))
        }
    })
    DBConnections = []

    return P.all(promises)
        .then(function () {
            callback && callback()
        })
        .catch(function (err) {
            callback && callback()
        })
}

function proExit(signal) {
    gracefulExit(function () {
        process.kill(process.pid, signal)
    })
}

exports.setupSafetyExit = function () {
    process.once('exit', gracefulExit)
        .once('SIGUSR2', function () {
            proExit('SIGUSR2')
        })
        .once('SIGINT', function () {
            proExit('SIGINT')
        })
        .once('SIGTERM', function () {
            proExit('SIGTERM')
        })
}