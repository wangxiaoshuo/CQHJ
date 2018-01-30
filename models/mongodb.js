/**
 * Created by Administrator on 2017/8/11.
 */
'use strict';

var mongoose = require('mongoose')

var fs = require('fs-extra')
var P = require('bluebird')

var Models = require('./models.js')

exports.appInit = function () {
    Models.initCommonDB()

    Models.setupSafetyExit()
}

exports.entryInit = function () {
    Models.initCommonDB()
    // Models.initCommonDB(['account', 'target', 'action', 'result'])

    Models.setupSafetyExit()
}

exports.apiInit = function () {
    Models.initCommonDB()
    // Models.initCommonDB(['account', 'target', 'action', 'result'])

    Models.setupSafetyExit()
}
