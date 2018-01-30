/**
 * Created by Administrator on 2017/8/9.
 */
'use strict';

require('console-stamp')(console, 'mm-dd HH:MM') //在node中使用控制台，并输出日期的log
var template = require('art-template')
var Express = require('express')
var App = module.exports = Express()
var Path = require('path')
var Logger = require('morgan')
var BodyParser = require('body-parser')
var Favicon = require('serve-favicon') //提供网站图标
var CookieParser = require('cookie-parser')()
var Timeout = require('connect-timeout')
var Compression = require('compression')()
var Session = require('express-session')
var RedisStore = require('connect-redis')(Session)
var MongoStore = require('connect-mongo')(Session);
var P = require('bluebird')

var Config = require('./config.js')
var Constant = Config['Constant'] || {}
var JSONPackage = require('./package.json')

process.umask(0) //设置或读取进程的文件模式创建掩码。子进程从父进程继承掩码。如果mask给定参数，则返回旧的掩码，否则返回当前掩码。
process.env = process.env || {}
process.env.PORT = process.env.PORT || Constant['PORT']
process.env.NODE_ENV = process.env.NODE_ENV || 'development'
App.settings.env = process.env.NODE_ENV
console.info('线程开启的环境: ', App.settings.env)
require('./global.js')()
global.isAPI = true

App.use(Favicon(__dirname + '/public/common/images/logo.png'))
App.use(Logger('dev'))
App.use(CookieParser)
App.use(Express.static(Path.join(__dirname, 'public')))
App.use(Timeout('60s'));
var maxAge = global.IS_PRODUCTION ? 3600 * 24 * 7 : 0;
App.use(Compression)
App.use(BodyParser.json());
App.use(BodyParser.urlencoded({extended: false}))

App.use('/common/css', Express.static(Path.join(__dirname, '/public/common/css/'), {maxAge: maxAge}))
App.use('/common/images', Express.static(Path.join(__dirname, '/public/common/images/'), {maxAge: maxAge}))
App.use('/common/js', Express.static(Path.join(__dirname, '/public/common/js/'), {maxAge: maxAge}))
App.use('/common/frontend/css', Express.static(Path.join(__dirname, '/public/common/frontend/css/'), {maxAge: maxAge}))
App.use('/common/frontend/images', Express.static(Path.join(__dirname, '/public/common/frontend/images/'), {maxAge: maxAge}))
App.use('/common/frontend/js', Express.static(Path.join(__dirname, '/public/common/frontend/js/'), {maxAge: maxAge}))
App.use('/lib', Express.static(Path.join(__dirname, '/public/lib/'), {maxAge: maxAge}))
App.use('/uploads', Express.static(Path.join(__dirname, '/uploads/'), {maxAge: maxAge}))
App.use('/build', Express.static(Path.join(__dirname, '/public/build/'), {maxAge: maxAge}))
App.use('/web', Express.static(Path.join(__dirname, '/public/web/'), {maxAge: maxAge}))
App.use('../web/locale', Express.static(Path.join(__dirname, '/public/web/locale/'), {maxAge: maxAge}))


//设置渲染视图模板
App.set('version', JSONPackage.version)
App.set('views', Path.join(__dirname, 'views'))
template.config('base', Path.join(__dirname, 'views'))
template.config('extname', '.html')
App.engine('.html', template.__express)
App.set('view engine', 'html')

App.use(Session({
    cookie: {maxAge: (1000 * 3600 * 24 * 30 *24)},
    secret: 'www.oibip.com',//通过设置 secret 来计算 hash 值并放在 cookie 中，使产生的 signedCookie 防篡改
    store: new RedisStore({
        'host' : '127.0.0.1',
        'port' : '6379',
        'ttl' : 1000*3600*24*30*24,
        'db' : 1
    }),//存到redis中
   /* store: new MongoStore({// 将 session 存储到 mongodb
        url: 'mongodb://localhost:27017/'// mongodb 地址
    }),*/
    resave: false,//resave: 即使 session 没有被修改，也保存 session 值，默认为 true。
    saveUninitialized: true //将session存储到内存中。
}))

//初始化连接数据库
require('./models/mongodb.js').appInit()

require('./controllers/router.js')(App)
var port = process.env.PORT
App.listen(port)
console.info('应用监听端口: ', port)
process.on('uncaughtException', function (err) {
    console.trace('未捕获的异常: ', err)
});