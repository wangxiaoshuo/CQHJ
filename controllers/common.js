/**
 * Created by Administrator on 2017/8/10.
 */
var express = require('express')
var app = express
var fs = require('fs')
var request = require('request');
var multer = require('multer')
var mongoose = require('mongoose')
var Excel = require('excel-class')
var path = require('path')
var User = mongoose.models.user
var Project = mongoose.models.project
var Notice = mongoose.models.notice
var moment = require("moment")
moment.locale('zh-cn')

exports.pageLogic = function (req,res,next) {
    var length = req.body.s
    var status = req.body.status
    var compan = req.body.compan
    if(compan != ""){
        User.find({enterprise:eval('/'+compan+'.*/i')}).sort({registerTime:-1}).limit(10)
            .then(function(doc){
                res.send(doc)
            })
    }else if(status != "" && status!= undefined && status != -1){
        User.find({user_status:status}).sort({registerTime:-1}).skip(10*(length-1)).limit(10)
            .then(function(doc){
                res.send(doc)
            })
    }else{
        User.find({}).sort({user_status:-1}).skip(10*(length-1)).limit(10)
            .then(function(doc){
                res.send(doc)
            })
    }

}

//上传模块
exports.upload = function (req,res,next) {
    var upload = multer({dest:'public/upload/'}).any()
    var tmp_path = []
    var tmp_mimetype = []
    var tmp_originalname = []
    var role = req.session.role
    var project = req.session.project
    var notice = req.session.notice
    var kind = req.session.kind
    var path = []
    if(req.session.username){
        var compan = req.session.username
    }else{
        var compan = req.session.compan
    }
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
        //var tmp_path = req.file.path;
        console.log(tmp_path,tmp_mimetype,tmp_originalname)
        console.log("role",role)
        if(role == 0){
            //创建uses存放资料的文件夹
            if(!fs.existsSync('uploads/users')){
                fs.mkdirSync('uploads/users')
            }else if(!fs.existsSync('uploads/users/'+compan+'/')){
                fs.mkdirSync('uploads/users/'+compan+'/')
                fs.mkdirSync('uploads/users/'+compan+'/images')
                fs.mkdirSync('uploads/users/'+compan+'/material')
            }
            for(var i in tmp_path){
                console.log(tmp_mimetype[i])
                //注意图片格式在不同浏览器下的变化
                if(tmp_mimetype[i] == 'image/jpeg' || tmp_mimetype[i] == 'image/pjpeg' || tmp_mimetype[i] == 'image/x-png' || tmp_mimetype[i] == 'image/png'){
                    var target_path = 'uploads/users/'+compan+'/images/' + tmp_originalname[i]
                }else{
                    var target_path = 'uploads/users/'+compan+'/material/' + tmp_originalname[i]
                }
                console.log(target_path)
                req.session.src = target_path

                console.log("target_path",target_path)
                if(kind == "sz"){
                    console.log("szszsz")
                    User.update({enterprise:compan},{$push:{business_licences:target_path}})
                        .then(function(doc){
                            var src = []
                            src[i] = fs.createReadStream(tmp_path[i])
                            var dest = fs.createWriteStream(target_path)
                            src[i].pipe(dest)
                            src[i].on('end',function (err) {
                                res.end()
                            })
                            src[i].on('error',function (err) {
                                res.end()
                                console.log(err)
                            })
                        })
                }else if(kind == "pz"){
                    console.log("pzpzpz")
                    Project.update({name:project},{$set:{status:5}})
                        .then(function(){
                            Project.update({name:project},{$push:{voucher:{path:target_path}}})
                                .then(function(){
                                    User.PfindOneAndUpdate({enterprise:compan},{$addToSet:{voucher:{project:project,name:tmp_originalname[i],url:target_path}}})
                                        .then(function(){
                                            User.PfindOne({enterprise:compan})
                                                .then(function(user){
                                                    var p = user.project
                                                    for(var k in p){
                                                        if(p[k].name == project){
                                                            p[k].result[0] = 3
                                                            p[k].result[1] = moment(new Date()).format('LL')
                                                            User.update({enterprise:compan},{$set:{project:p}})
                                                                .then(function(){
                                                                    var src = []
                                                                    src[i] = fs.createReadStream(tmp_path[i])
                                                                    var dest = fs.createWriteStream(target_path)
                                                                    src[i].pipe(dest)
                                                                    src[i].on('end',function (err) {
                                                                        res.end()
                                                                    })
                                                                    src[i].on('error',function (err) {
                                                                        res.end()
                                                                        console.log(err)
                                                                    })
                                                                })
                                                        }
                                                    }
                                                })
                                        })
                                })

                        })
                }
                if(kind != 'sz' && kind != 'pz')
                {
                    console.log("222222")
                    console.log("target_path",target_path)
                    User.PfindOne({enterprise:compan})
                        .then(function(user){
                            Project.PfindOne({name:project})
                                .then(function(p){
                                    var again = false
                                    var pro = user.project
                                    var acc = p.account
                                    for(var n=0;n<pro.length;n++){
                                        if(pro[n].name == project){
                                            again = true
                                            pro[n].material.push(target_path)
                                        }
                                    }
                                    for(var m=0;m<acc.length;m++){
                                        if(acc[m].enterprise == compan){
                                            acc[m].material.push(target_path)
                                        }
                                    }
                                    if(again == true){
                                        path.push(target_path)
                                        console.log("again")
                                        console.log("path",path)
                                        User.update({enterprise:compan},{$set:{'project':pro}})
                                            .then(function(doc){
                                                User.PfindOne({enterprise:compan})
                                                    .then(function(doc){
                                                        var openid = doc.openid
                                                        Project.update({name:project},{$set:{'account':acc}})
                                                            .then(function(){
                                                                var src = []
                                                                src[i] = fs.createReadStream(tmp_path[i])
                                                                var dest = fs.createWriteStream(target_path)
                                                                src[i].pipe(dest)
                                                                src[i].on('end',function (err) {
                                                                    res.end()
                                                                })
                                                                src[i].on('error',function (err) {
                                                                    res.end()
                                                                    console.log(err)
                                                                })
                                                            })
                                                    })

                                            })
                                            .catch(function (err) {
                                                console.log(err)
                                            })
                                    }else{
                                        console.log("no again")
                                        User.update({enterprise:compan},{$push:{'project':{'name':project,'material':target_path,'progress':[1,moment(new Date()).format('LL')],bm_time:new Date().getTime()}}})
                                            .then(function(doc){
                                                User.PfindOne({enterprise:compan})
                                                    .then(function(doc){
                                                        var openid = doc.openid
                                                        Project.update({name:project},{$push:{'account':{'openid':openid,'material':target_path,enterprise:compan,name:doc.name,email:doc.email,tel:doc.tel,address:doc.address,progress:[1,moment(new Date()).format('LL')]}}})
                                                            .then(function(){
                                                                var src = []
                                                                src[i] = fs.createReadStream(tmp_path[i])
                                                                var dest = fs.createWriteStream(target_path)
                                                                src[i].pipe(dest)
                                                                src[i].on('end',function (err) {
                                                                    res.end()
                                                                })
                                                                src[i].on('error',function (err) {
                                                                    res.end()
                                                                    console.log(err)
                                                                })
                                                            })
                                                    })

                                            })
                                            .catch(function (err) {
                                                console.log(err)
                                            })
                                    }
                                })
                        })

                }
            }

        }else if(role >= 2){
            //创建admin存放资料的文件夹
            if(!fs.existsSync('uploads/admin')){
                fs.mkdirSync('uploads/admin/')
            }else if(!fs.existsSync('uploads/admin/projects')){
                fs.mkdirSync('uploads/admin/projects') //存放项目材料
            }else if(!fs.existsSync('uploads/admin/projects/'+project)){
                fs.mkdirSync('uploads/admin/projects/'+project)
            }else if(!fs.existsSync('uploads/admin/judges')){
                fs.mkdirSync('uploads/admin/judges') //专家列表
            }
            for(var i in tmp_path){
                console.log(tmp_mimetype[i])
                //注意图片格式在不同浏览器下的变化
                var target_path = 'uploads/admin/projects/'+ project + '/'+ tmp_originalname[i]
                console.log(target_path)
                req.session.src = target_path
                Project.PfindOneAndUpdate({name:project},{$push:{material:{name:tmp_originalname[i],url:target_path}}})
                    .then(function (doc) {
                        Notice.PfindOneAndUpdate({name:notice},{$push:{material:{name:tmp_originalname[i],url:target_path}}})
                            .then(function(doc){
                                var src = []
                                src[i] = fs.createReadStream(tmp_path[i])
                                var dest = fs.createWriteStream(target_path)
                                src[i].pipe(dest)
                                src[i].on('end',function (err) {
                                    res.end()
                                })
                                src[i].on('error',function (err) {
                                    res.end()
                                    console.log(err)
                                })
                            })

                    })
            }
        }
    })
}


//解析xlsx存入数据库
exports.xlsxParse = function (req,res,next) {
    var excel = new Excel(path.join(__dirname,'../uploads/admin/experts/account.xlsx'))
    var aa = excel.readSheet('Sheet1')
    var bb = excel.readRow('Sheet1',1)
    var cc = excel.readCell('Sheet1',aa.length,"公司名称")
    /*for(var i = 0;i<aa.length;i++){
        var option = {}
        option.enterprise = aa[i]["公司名称"]
        option.number = aa[i]["纳税人识别号"]
        option.address = aa[i]["公司地址"]
        option.email = aa[i]["邮箱"]
        option.tel = aa[i]["联系电话"]
        option.name = aa[i]["基本账户户名"]
        option.bank = aa[i]["开户行"]
        option.account = aa[i]["账号"]

        console.log("option",option)
        Account.PaddOrUpdate(option)
            .catch(function (err) {
                console.log(err)
            })

    }*/
    User.PaddOrUpdate({enterprise:"F",number:223,address:"蜀兴七号",email:"123@qq.com",tel:158745689,name:"wangxiaoshuo",bank:"建设银行",account:65585555})
        .catch(function (err) {
            console.log(err)
        })
    res.redirect('/admin/administer.html')
}
var excel = new Excel(path.join(__dirname,'../uploads/admin/experts/account.xlsx'))
function writeSheet(Sheet,arr,doc){
    excel.writeSheet(Sheet,arr,doc)
}
function writeRow(Sheet,i,doc){
    excel.writeRow(Sheet,i,doc).then(function (obj) {
        console.log(excel.readRow("Sheet1",i))
    }).catch(function(err){
        console.log(err)
    })
}

//docx文档预览
var mammoth = require("mammoth")
exports.materialView =function (req,res,next) {
    var url = req.query.url
    console.log("url1",url)
    console.log("url2",decodeURI(url))

    var options = {
        styleMap : [
            "u => u"
        ]
    }
    mammoth.convertToHtml({path: url},options)
        .then(function(result){
            console.log(result)
            var html = result.value; // The generated HTML
            var messages = result.messages; // Any messages, such as warnings during conversion
            var option={
                html:html,
                path:url
            }
            res.go("/backend/admin/material",option)
        })

}

exports.docxParse =function (req,res,next) {
    var url = decodeURI(req.body.url)
    console.log("url",url)
}

//pdf预览
exports.pdfView = function(req,res,next){

    var options = {
        path:path
    }
    res.go("/backend/admin/viewer",options)
}
//docx文件下载
exports.fileDownload = function(req,res,next){
    var path = req.body.path
    var name = req.body.name
    console.log(path)
    console.log(name)
   /* var f = fs.createReadStream(path);
    res.writeHead(200, {
        'Content-Type': 'application/force-download',
        'Content-Disposition': 'attachment; filename='+name
    });
    f.pipe(res);*/

    var fileUrl  = 'http://image.tianjimedia.com/uploadImages/2015/129/56/J63MI042Z4P8.jpg';
    var filename = name;
    downloadFile(fileUrl,filename,function(){
        console.log(filename+'下载完毕');
    });

   /* var img_src = 'https://www.baidu.com/img/bd_logo1.png'; //获取图片的url
    //采用request模块，向服务器发起一次请求，获取图片资源
    request.head(img_src,function(err,res,body){
        if(err){
            console.log(err);
        }
    });

    var img_filename = 'mu.jpg';
    request(img_src).pipe(fs.createWriteStream('./'+ img_filename));*/
}
//查询数据库导出xlsx
//TODO is not a function?
exports.xlsxInsert = function (req,res,next) {
              /*  excel.writeRow("Sheet1",1,{
                    "公司名称":"22",
                    "纳税人识别号":2222,
                    "公司地址":"33",
                    "邮箱":"77",
                    "联系电话":77,
                    "基本账户户名":"77",
                    "开户行":"77",
                    "账号":77
                }).then(function (obj) {
                    console.log("obj",obj)
                }).catch(function(err){
                    console.log(err)
                })*/
                //fs.unlinkSync('../oibip/uploads/backend/experts/account.xlsx')
                function forWriteRow() {
                    Account.find({role:0})
                        .then(function(doc){
                            if(!doc || doc.length == 0){
                                console.log("数据不存在")
                            } else {
                                console.log(doc.length)
                                for(var i=0;i<doc.length;i++){
                                        setTimeout(function(){
                                            excel.writeRow('Sheet1',i+1,{
                                                "公司名称":doc[i].enterprise,
                                                "纳税人识别号":doc[i].number,
                                                "公司地址":doc[i].address,
                                                "邮箱":doc[i].email,
                                                "联系电话":doc[i].tel,
                                                "基本账户户名":doc[i].name,
                                                "开户行":doc[i].bank,
                                                "账号":doc[i].account
                                            }).then(function (obj) {
                                                console.log(excel.readRow("Sheet1",i))
                                            }).catch(function(err){
                                                console.log(err)
                                            })
                                        },0)
                                }
                            }
                        })
                        .catch(function(err){
                            console.log(err)
                        })
                }
                console.log(typeof(forWriteRow))
                forWriteRow()
               /* for(var i=0;i<doc.length;i++){
                    console.log(i)
                    var excel = new Excel(path.join(__dirname,'../uploads/backend/experts/account.xlsx'))


                    /!*excel.writeRow('Sheet1',i+1,{
                        "公司名称":doc[i].enterprise,
                        "纳税人识别号":doc[i].number,
                        "公司地址":doc[i].address,
                        "邮箱":doc[i].email,
                        "联系电话":doc[i].tel,
                        "基本账户户名":doc[i].name,
                        "开户行":doc[i].bank,
                        "账号":doc[i].account
                    }).then(function (obj) {
                        console.log(excel.readRow("Sheet1",i))
                    }).catch(function(err){
                        console.log(err)
                    })*!/

                }*/
    res.redirect('/backend/admin/administer.html')
}


//设置session
exports.setSession = function(req,res,next){
    var project = req.body.project
    var kind = req.body.kind
    console.log("pro",project)
    console.log("kind",kind)
    req.session.project = project
    req.session.kind = kind
    console.log("c1",req.session.compan)
    console.log("c2",req.session.username)
    res.send(true)
}

function downloadFile(uri,filename,callback){
    var stream = fs.createWriteStream(filename);
    request(uri).pipe(stream).on('close', callback);
}