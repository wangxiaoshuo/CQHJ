/**
 * Created by Administrator on 2017/8/10.
 */
'use strict';

var _ = require('lodash')
var multer = require('multer')
var upload = multer({dest:'upload/'})

var Config = require('../config.js')
var Constant = Config['Constant'] || {}
var IS_CONFUSION = Constant['IS_CONFUSION'] || false
var Template = require('./lib/template.js')
var DEFAULAT_HOST = /^open\.oibip\.com$/

module.exports = function(app){
    requestHandler(app)
    //路由设置
    commonRoutes(app)
    adminRoutes(app)
    judgeRoutes(app)
    companRoutes(app)
    projectRoutes(app)
    noticeRoutes(app)
    frontendRoutes(app)
}
function requestHandler(app) {
    app.use(function (req, res, next) {
        req.session = req.session || {}

        var host = req.headers.host
        if(DEFAULAT_HOST.exec(host)){
            req.session.host = 'default'
        }else{
            req.session.host = 'default'
        }
        res.set({
            'strict-transport-security': 'max-age=31536000; includeSubDomains',
            'x-content-type-options': 'nosniff',
            'x-frame-options': 'SAMEORIGIN',
            'x-xss-protection': '1; mode=block'
        })
        res.go = function (view, options) {
            options = options || {}
            var o = {views: app.get('views'), APPVersion: app.get("version"), env: app.settings.env}
            _.extend(options, o)

            options.is_confusion = IS_CONFUSION
            options.host = req.session.host
            options.time = new Date().getTime()

            res.format({
                html: function () {
                    if (req.user && options) options.user = req.user
                    Template.render(view, options, function (err, data) {
                        if (err) {
                            res.send(err.message)
                            console.trace(err)
                        } else {
                            res.send(data)
                        }
                    })
                },
                json: function (view, options) {
                    res.jsonp(options)
                }
            })
        }
        res.err = function (err) {
            console.trace(err)
            // this.go('err', {err: 1, msg: err.message || err})
            res.go('error', {message: err.message || err})
        }
        res.warn = function (msg) {
            console.warn(new Date, msg)
            // this.go('err', {err: 1, msg: msg})
            res.go('error', {message: msg})
        }

        req.isAjax = (req.header('x-requested-with') === "XMLHttpRequest")
        next()
    })
}

function commonRoutes(app){
    var common = require('./common.js')
    var admin = require('./admin.js')
    app.post('/parse',common.xlsxParse)
    app.post('/insert',common.xlsxInsert)
    app.post('/page.html',common.pageLogic)
    app.get("/material.html",common.materialView)
    app.post("/material.html",common.docxParse)
    app.post("/set.html",common.setSession)

    //pdf预览
    app.get("/pdf.html",common.pdfView)
    //docx文件下载
    app.post("/file/download.html",common.fileDownload)
}

function adminRoutes(app){
    var admin = require('./admin.js')

    app.get('/admin/login.html',admin.loginView)
    app.post('/admin/login.html',admin.loginLogic)
    app.get('/admin/index.html',requiredAuthentication,admin.indexView)
    app.get('/admin/logout.html',requiredAuthentication,admin.logoutLogic)

    app.get('/admin/admins.html',requiredAuthentication,admin.adminsView)
    app.get('/admin/admin-add.html',requiredAuthentication,admin.adminAddView)
    app.post('/admin/admin-add.html',requiredAuthentication,admin.adminAdd)
    app.post('/admin/admin-delete.html',requiredAuthentication,admin.adminDelete)
    app.post('/admin/admin-enable.html',requiredAuthentication,admin.adminEnable)
    app.post('/admin/admin-edit.html',requiredAuthentication,admin.adminEdit)
    app.get('/admin/user_validate',requiredAuthentication,admin.adminValidate)

    app.get('/admin/dashboard.html',requiredAuthentication,admin.dashboardView)
    app.get('/admin/error.html',requiredAuthentication,admin.errorView)
}

function companRoutes(app) {
    var compan = require('./compan.js')
    var common = require("./common.js")
    var home = require("./home.js")
    app.get('/admin/compan.html',requiredAuthentication,compan.companLogic)//列表逻辑
    app.get('/admin/compan-add.html',requiredAuthentication,compan.companAddView)
    app.post('/admin/compan-add.html',compan.companAdd)//增加用户
    app.post('/user/delete.html',requiredAuthentication,compan.companDelete)//删除用户
    app.post("/admin/compan-edit.html",requiredAuthentication,compan.companEdit)//编辑
    app.post("/user/search.html",requiredAuthentication,compan.companSearch)//查找
    app.get('/admin/compan-show.html',requiredAuthentication,compan.companShowView)//查看信息
    app.post("/user/verify.html",requiredAuthentication,compan.companVerify)//审核
    app.get('/admin/password.html',requiredAuthentication,compan.passwordView)
    app.post('/admin/reset.html',requiredAuthentication,compan.resetPassword)

    app.get('/user/bm_project.html',requiredAuthentication,compan.bmProjectLogic)
    app.get('/admin/project_list.html',requiredAuthentication,compan.projectLogic)
    app.post('/user/bm_project.html',requiredAuthentication,compan.page)
    app.post('/admin/project_page.html',requiredAuthentication,compan.projectPage)
    app.get('/admin/affiche_list.html',requiredAuthentication,compan.afficheView)
    app.post('/admin/affiche_page.html',requiredAuthentication,compan.noticePage)
    app.get('/upload/material.html',compan.uploadMaterial)
    app.get('/admin/person.html',compan.personView)
    app.post('/user/project_page.html',compan.bmProjectPage)//我报名的项目分页
    app.post('/user/bm.html',compan.bmVerify)
    app.post('/user/pz.html',compan.pzVerify)

    //查看该项目下的所有公告附件
    app.get("/project/notice.html",requiredAuthentication,compan.noticeListShow)
}

function judgeRoutes(app){
    var jude = require('./judge.js')
    app.get('/admin/judge.html',requiredAuthentication,jude.judgeView)
    app.get('/admin/judge-edit.html',requiredAuthentication,jude.judgeEdit)
    app.post('/admin/judge-delete.html',requiredAuthentication,jude.judgeDelete)
    app.post('/admin/judge-edit.html',requiredAuthentication,jude.judgeEditView)
    app.post('/admin/judge-add.html',requiredAuthentication,jude.judgeAdd)
    app.get('/admin/judge-importv.html',requiredAuthentication,jude.judgeImportView)
    app.post('/judge-upload',requiredAuthentication,jude.upload)
    app.get('/admin/judge-export.html',requiredAuthentication,jude.judgeExport)
    app.get('/admin/random.html',requiredAuthentication,jude.judgeChooseView)
    app.post('/remark/save.html',requiredAuthentication,jude.remarkSave)
    app.post('/verify/judge.html',requiredAuthentication,jude.judgeVerify)
    app.post('/verify/template.html',requiredAuthentication,jude.templateVerify)
    app.post('/show/judge.html',requiredAuthentication,jude.judgeShow)

    app.get('/admin/show_compan.html',requiredAuthentication,jude.bmCompanShow)
    app.get('/admin/scoring.html',jude.scoringView)
    app.post('/compan/pages.html',jude.companPage)
}

function projectRoutes(app) {
    var project = require("./project.js")
    var common = require("./common.js")
    app.post('/project/pages.html',project.pageLogic)
    app.post('/file-upload.html',common.upload,project.projectLogic)
    app.get('/admin/project.html',requiredAuthentication,project.projectLogic)
    app.get('/admin/project-add.html',requiredAuthentication,project.projectAddView)
    app.post('/project-add.html',requiredAuthentication,project.projectAdd)
    app.post('/project/delete.html',requiredAuthentication,project.projectDelete) //删除用户
    app.post("/project/cancel.html",requiredAuthentication,project.projectCancel)
    app.post("/project-edit.html",requiredAuthentication,project.projectEdit)//编辑
    app.post("/project/search.html",requiredAuthentication,project.projectSearch)//查找
    app.get('/project_validate',requiredAuthentication,project.projectValidate)//验证

    app.get('/admin/compan-export.html',requiredAuthentication,project.companExport)//导出报名用户
    app.get('/template.html',requiredAuthentication,project.setTemplateView)//设置评审模板
    app.post('/template.html',requiredAuthentication,project.setTemplate)

    app.get('/admin/apply.html',requiredAuthentication,project.applyLogic)
    app.post('/apply/pages.html',project.applyPageLogic)
    app.get('/admin/reviews.html',requiredAuthentication,project.reviewView)
    app.post('/review/pages.html',project.reviewPageLogic)
    app.post("/review/verify.html",requiredAuthentication,project.reviewVerify)//审核
    app.post("/pz/verify.html",project.pzVerify)//审核凭证
    app.post("/review/continue.html",requiredAuthentication,project.reviewContinue)//是否递补
    app.post('/project/judge.html',project.judgeUpdate)
    app.post('/project/score.html',project.saveScore)

    app.get('/bcompans.html',project.bcompanLogic)
    app.get('/result.html',project.resultLogic)
}

function noticeRoutes(app) {
    var  notice= require("./notice.js")
    var common = require("./common.js")
    app.post('/notice/pages.html',notice.pageLogic)
    app.post('/file-upload.html',common.upload,notice.noticeLogic)
    app.get('/admin/affiches.html',requiredAuthentication,notice.noticeLogic)
    app.get('/notice-add.html',requiredAuthentication,notice.noticeAddView)
    app.post('/notice-add.html',requiredAuthentication,notice.noticeAdd)
    app.post('/notice/delete.html',requiredAuthentication,notice.noticeDelete) //删除用户
    app.post("/notice-edit.html",requiredAuthentication,notice.noticeEdit)//编辑
    app.post("/notice/search.html",requiredAuthentication,notice.noticeSearch)//查找
    app.get('/notice_validate',requiredAuthentication,notice.noticeValidate)//验证
}

function frontendRoutes(app){
    var home = require('./home.js')
    var common = require("./common.js")
    app.get('/frontend/project.html',home.wechatAuthHandler,home.projectLogic)
    app.post('/frontend/project/search.html',home.projectSearch)
    app.get('/frontend/affiche.html',home.noticeLogic)
    app.get('/frontend/project/notice.html',home.showNotice)
    app.post('/verify/file.html',home.fileVerify)//验证项目是否是报名状态
    app.get('/frontend/info.html',home.personWs)
    app.get('/frontend/center.html',home.person)
    app.get('/frontend/person.html',home.wechatAuthHandler,home.personLogic)
    app.post('/file-upload.html',common.upload,home.person)
    app.get('/frontend/verify.html',home.verify)
    app.get("/frontend/login.html",home.userLoginView)
    app.post("/frontend/login.html",home.userLogin)
}

function requiredAuthentication(req, res, next) {
    if (req.session.username) {
        next();
    } else {
        res.redirect('/admin/login.html');
    }
}


