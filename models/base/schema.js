/**
 * Created by Administrator on 2017/8/10.
 */
'use strict';

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var P = require('bluebird')
var _ =  require('lodash')

var MyUtil = require('../../lib/util.js')

var ExtMethods = {}

var mongoDocToJSObj = function (docs) {
    var single = false
    if(!_.isArray(docs)){
        docs = [docs]
        single = true
    }
    for(var i = 0;i<docs.length;i++){
        docs[i] = docs[i] ? docs[i].toObject() : docs[i]
    }
    if(single){
        return docs[0]
    }else{
        return docs
    }
}
ExtMethods.Pfind = function(query,sort,skip,limit,projection){
    var thisModel = this
    return new P(function(resolve,reject,notify){
        thisModel.find(query,projection).sort(sort).skip(skip).limit(limit).exec(function(err,doc){
            if(err){
                reject(err)
            }else{
                resolve(mongoDocToJSObj(doc))
            }
        })
    })
}

ExtMethods.PfindOne = function (query,projection) {
    query = query || {}
    var thisModel = this
    return new P(function(resolve,reject){
        thisModel.findOne(query,projection,function(err,doc){
            if(err){
                reject(err)
            }else{
                resolve(mongoDocToJSObj(doc))
            }
        })
    })
}

ExtMethods.PfindOneAndUpdate = function (query, update, options) {
    var thisModel = this
    return new P(function (resolve, reject, notify) {
        thisModel.findOneAndUpdate(query, update, options, function (err, doc) {
            if (err) {
                reject(err)
            } else {
                resolve(mongoDocToJSObj(doc))
            }
        })
    })
}

ExtMethods.Pupdate =function (query,doc,options){
    var thisModel = this
    return new P(function(resolve,reject){
        thisModel.update(query,doc,options,function(err,numberAffected,raw){
            if(err){
                reject(err)
            }else{
                resolve([numberAffected,raw])
            }
        })
    })
}

ExtMethods.PfindById = function (_id, projection) {
    return this.PfindOne({_id: _id}, projection)
}

ExtMethods.PdeleteById= function (_id,projection) {
    var thisModel = this
    return new P(function (resolve, reject, notify) {
        thisModel.remove({_id:_id},function (err,doc) {
            if (err) {
                return false
            } else {
                console.log(_id+':删除成功')
                return true
            }
        })
    })
}

ExtMethods.Psave = function (doc) {
    var thisModel = this
    return new P(function (resolve, reject, notify) {
        (new thisModel(doc)).save(function (err, doc) {
            if (err) {
                reject(err)
            } else {
                resolve(mongoDocToJSObj(doc))
            }
        })
    })
}

ExtMethods.Pinsert = function (docs) {
    var thisModel = this
        , saveTime = Date.now()
    return new P(function (resolve, reject, notify) {
        thisModel.collection.insert(docs, {ordered: false, writeConcern: {w: "majority", j: false, wtimeout: 1000}}
            , function (err, writeResult) {
                docs = null
                if (err) {
                    console.error(err)
                    reject(err)
                } else {
                    var len = writeResult.ops.length
                    console.log('[Pinsert] Mongo 插入数据量: ', len, ', 耗时: ', (Date.now() - saveTime)
                        , 'collection: ', thisModel.collection.name)
                    resolve(len)
                    writeResult = null
                }
            })
    })
}

module.exports = function (schema, includeMethods, excludeMethods) {
    if (schema instanceof Schema) {
        if (Array.isArray(excludeMethods) && excludeMethods.length > 0) {
            for (var k in ExtMethods) {
                if (!_.contains(excludeMethods, k)) {
                    schema.statics[k] = ExtMethods[k]
                }
            }
        }
        else if (Array.isArray(includeMethods) && includeMethods.length > 0) {
            for (var k in ExtMethods) {
                if (_.contains(includeMethods, k)) {
                    schema.statics[k] = ExtMethods[k]
                }
            }
        }
        else {
            for (var k in ExtMethods) {
                schema.statics[k] = ExtMethods[k]
            }
        }
    }
}