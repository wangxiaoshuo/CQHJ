/**
 * Created by Administrator on 2017/8/10.
 */
var mongoose = require("mongoose")
var Judge = mongoose.models.judge
var Project = mongoose.models.project
var User = mongoose.models.user
var Config = require('../config.js')
var Constant = Config['Constant'] || {}
var template = require('./lib/template.js')
var md5 = require("blueimp-md5").md5
var _ = require("lodash")
var P = require("bluebird")
var Util = require("../lib/util.js")
var Path = require("path")
var json = {state: -1, message: '操作失败', data: {}}
var Excel = require('excel-class')
var multer = require('multer')
var fs = require('fs')
var nodeExcel = require('excel-export')

exports.judgeView = function (req, res, next) {
    var current = req.query.current || 1
    var pagesize = req.query.pagesize || 10
    var skips = (current * pagesize) - pagesize;
    console.log("current:"+current+" pagesize:"+pagesize+" skips:"+skips)
    Judge.find({}).then(function (all) {
        Judge.find({}).sort({judge_status:-1}).skip(skips).limit(pagesize).then(function(doc){
            var options = {
                // L: Lang.getFile(req.session.lang, 'index')
                judges:doc,
                current:current,
                pagesize:pagesize,
                pagecount:all.length
            }
            res.go('/backend/admin/judges', options)
        })
    })

}

exports.judgeEdit = function (req, res, next) {
    var options = {
        // L: Lang.getFile(req.session.lang, 'index')
    }
    res.go('/backend/admin/judges-edit', options)
}

exports.judgeEditView = function (req,res,next) {
    var id = req.body.id
    Judge.PfindOne({_id:id}).then(function (doc) {
        if(doc){
            res.send(doc)
        }
    })
}

exports.judgeDelete = function (req, res, next) {
    var ids = req.body.ids
    var _ids=ids.split(",")
    for (var i=0;i<_ids.length;i++){
        Judge.PdeleteById(_ids[i])
    }
    res.send(true)
}

exports.judgeAdd = function (req, res, next) {
    var judge = {}
    judge.id = req.body.id
    judge.name = req.body.name
    judge.number = req.body.number
    judge.tel = req.body.tel
    judge.relevance = req.body.relevance
    judge.department = req.body.department
    judge.judge_status = 3
    console.log("11",judge.id)
    if(judge.id == 0){
        Judge.Pinsert(judge).then(function(doc){
            res.send(true)
        })
    }else{
        Judge.PaddOrUpdate(judge,{_id:judge.id}).then(function(doc){
            res.send(true)
        })
    }
}

exports.judgeImportView = function (req,res,next) {
    var options = {
        // L: Lang.getFile(req.session.lang, 'index')
    }
    res.go('/backend/admin/judges-import', options)
}

exports.judgeExport = function (req,res,next) {
    console.log("导出评委excel数据")
    Judge.find({})
        .then(function(doc){
            if(!doc || doc.length == 0){
                console.log("数据不存在")
            } else {
                console.log(doc.length)
                var conf ={};
                conf.name = "Sheet1";
                conf.cols =[{
                    caption:'姓名',
                    type:'string'
                },{
                    caption:'证书编号',
                    type:'string'
                },{
                    caption:'联系电话',
                    type:'string'
                },{
                    caption:'关联专业',
                    type:'string'
                },{
                    caption:'公司部门',
                    type:'string'
                }]
                var rows =new Array()
                for(var i=0;i<doc.length;i++) {
                    rows.push([doc[i].name,doc[i].number,doc[i].tel,doc[i].relevance,doc[i].department]);
                }
                conf.rows=rows
                var result = nodeExcel.execute(conf);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats');
                res.setHeader("Content-Disposition", "attachment; filename=" + "judge.xlsx");
                res.end(result, 'binary');
            }
        })
        .catch(function(err){
            console.log(err)
        })
}

exports.upload = function (req,res,next) {
    console.log("Import Excel");
    var upload = multer({dest:'public/upload/'}).any()
    var tmp_path = []
    var tmp_mimetype = []
    var tmp_originalname = []
    upload(req,res,function(err){
        if(err){
            console.log(err)
            return
        }
        console.log(req.files)
        //遍历上传上来的文件
        req.files.forEach(function (value, index, arr) {
            tmp_path[index] = value.path
            tmp_mimetype[index] = value.mimetype
            tmp_originalname[index] = value.originalname
        })
        //创建judges存放资料的文件夹
        if(!fs.existsSync('uploads/admin')){
            fs.mkdirSync('uploads/admin/')
        }else if(!fs.existsSync('uploads/admin/projects')){
            fs.mkdirSync('uploads/admin/projects') //存放项目材料
        }else if(!fs.existsSync('uploads/admin/judges')){
            fs.mkdirSync('uploads/admin/judges') //专家列表
        }
        for(var i in tmp_path){
            console.log(tmp_mimetype[i])
            //注意图片格式在不同浏览器下的变化
            if(tmp_mimetype[i] == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'){
                var target_path = 'uploads/admin/judges/'+ tmp_originalname[i]
            }else{
                res.send(err)
            }
            console.log(target_path)
            req.session.src = target_path
            var src = []
            src[i] = fs.createReadStream(tmp_path[i])
            var dest = fs.createWriteStream(target_path)
            src[i].pipe(dest)
            dest.on('close',function (err) {
                //解析入库
                parseExcelToMongo(target_path)
                res.send(true)
            })
            src[i].on('error',function (err) {
                res.end()
                console.log(err)
            })
        }

    })

}

//输出所有在空闲的评委
exports.judgeChooseView = function(req,res,next){
    var project = req.query.id
    Judge.find({judge_status:3}).then(function(all){
        var options = {
            judges:JSON.stringify(all),
            project:project
        }
        res.go("/backend/admin/random",options)
    })

}

exports.remarkSave = function (req,res,next) {
    var name = req.body.name
    var remark = req.body.remark
    Judge.PfindOneAndUpdate({name:name},{$set:{remark:remark,judge_status:1}})
        .then(function (doc) {
            res.send(true)
        })
}

exports.scoringView = function (req,res,next) {
    var username = req.session.username
    Judge.PfindOne({name:username})
        .then(function(doc){
            var project = doc.project
            var id
            for(var i = 0;i<doc.project.length;i++){
                if(project[i].status == 'going'){
                    id = project[i].project_id
                }
            }
            //查找评委正在评审的项目
            Project.PfindOne({_id:id})
                .then(function(doc2){
                    var length = JSON.stringify(doc2.account.length)
                    Project.PfindOne({_id:id})
                        .then(function(project){
                            console.log(project)
                            var options = {
                                length:length,
                                name:project.name,
                                address:project.template[0].address,
                                template:JSON.stringify(project.template[0]),
                                user:JSON.stringify(project.account),
                                mode:project.mode
                            }
                            res.go("/backend/judge/scoring",options)
                        })
                })
        })


}

//输出所有报名在项目的用户
exports.bmCompanShow = function (req,res,next) {
    var username = req.session.username
    Judge.PfindOne({name:username})
        .then(function(doc) {
            var project = doc.project
            var id
            for (var i = 0; i < doc.project.length; i++) {
                if (project[i].status == 'going') {
                    id = project[i].project_id
                }
            }
            Project.PfindOne({_id:id})
                .then(function(project){
                    var name = project.name
                    //查找评委正在评审的项目
                    User.find({'project':{$elemMatch:{name:name}}})
                        .then(function(user){
                            console.log("user",user)
                            var uProject = []
                            for(var i=0;i<user.length;i++){
                                var compan = user[i].enterprise
                                for(var j=0;j<user[i].project.length;j++){
                                    if(user[i].project[j].name == name){
                                        var filenameArr = []
                                        var path = user[i].project[j].material
                                        console.log(path)
                                        for(var k = 0;k<path.length;k++){
                                            var arr = path[k].split("/")
                                            var filename = arr[arr.length - 1]
                                            filenameArr.push(filename)
                                        }
                                        var p = {
                                            name:compan,
                                            filenameArr:filenameArr,
                                            path:path
                                        }
                                        uProject.push(p)
                                    }
                                }

                            }
                            console.log("uProject",uProject)
                            var options = {
                                uProject:JSON.stringify(uProject),
                                project:name
                            }
                            res.go('/backend/judge/compan',options)
                        })
                })

        })

}


//验证是否已经选了评委
exports.judgeVerify = function (req,res,next) {
    var id = req.body.id
    Project.PfindOne({_id:id})
        .then(function(doc){
            var judge = doc.judge
            if(judge.length > 0){
                res.send({verify:true})
            }else{
                res.send({verify:false})
            }
        })
}

//验证是否设置了模板
exports.templateVerify = function (req,res,next) {
    var name = req.body.name
    Project.PfindOne({name:name})
        .then(function(doc){
            var template = doc.template
            if(template.length > 0){
                res.send({verify:true})
            }else{
                res.send({verify:false})
            }
        })
}

//输出项目选定的评委信息
exports.judgeShow = function (req,res,next) {
    var id = req.body.id
    Project.PfindOne({_id:id})
        .then(function(doc){
            var judge = doc.judge
            console.log(judge)
            res.send({judge:judge})
        })
}
exports.companPage = function (req,res,next) {
    
}

//定时任务
var schedule = require('node-schedule');

function scheduleCronstyle(){
    schedule.scheduleJob('00 00 00 * * *', function(){
        console.log('scheduleCronstyle:' + new Date());
        Judge.update({judge_status:1},{$set:{judge_status:3,remark:""}},{multi:true})
            .then(function(doc){
                console.log("update")
            })
    });
}
scheduleCronstyle();
/*
* 解析XLSX入库
* */
function parseExcelToMongo(target_path) {
    var xlsx_path='../'+target_path
    console.log(xlsx_path)
    var excel = new Excel(Path.join(__dirname,xlsx_path))
    var sheet1 = excel.readSheet('Sheet1')
    console.log(sheet1.length)
    for(var i = 0;i<sheet1.length;i++){
        var judge = {}
        judge.name = sheet1[i]["姓名"]
        judge.number = sheet1[i]["证书编号"]
        judge.tel = sheet1[i]["联系电话"]
        judge.relevance = sheet1[i]["关联专业"]
        judge.department = sheet1[i]["公司部门"]
        judge.judge_status = 3
        Judge.PaddOrUpdate(judge,{name:judge.name})
    }
}






