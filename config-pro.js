'use strict';

// 变量 配置
var Constant = {
    'IS_CONFUSION': false,

    'PORT': 5151,

    'APP_URL_LAN': 'http://192.168.1.100:5151',
    'APP_URL_WAN': 'http://119.23.28.61:15155',
    'API_URL_LAN': 'http://192.168.1.100:5252',
    'API_URL_WAN': 'http://119.23.28.61:25255',
    // 注意: 局域网 和 广域网 的图片连接适配问题
    'IMAGE_URL': 'http://119.23.28.61:15155',
    'AI_URL': 'http://ai-api.feebird.cn:2828/api/classification/picture.html',

    // 'MAIN_DB_URI': 'mongodb://root:qwe123!@192.168.1.100:27017/',
    'MAIN_DB_URI': 'mongodb://192.168.1.100:38940/',
    'MONGOS': false,
    'COMMON_DB_NAME': 'db_cqhj',
    'AUTH_DB_NAME': 'admin',
    'OAUTH_DB_NAME': 'db_oauth',
    'PRODUCT_DB_PREFIX': 'db_',

    'REDIS_PORT': 6379,
    'REDIS_HOST': '192.168.1.100',

    'MEMCACHED': '192.168.1.100:58888'
}

// 数据 配置
var DataDisks = {
    // // TODO 对拷前必须先实现
    // 'APP': [
    //     '/data/images/mc0_disk1/app/'
    // ],
    // 'API': [
    //     '/data/images/mc1_disk1/api/'
    // ]
    'APP': [
        '/data/ds1_disk1/cqhj-app/'
    ],
}


// 页面 配置
var PageMeta = {
    'zh': {
        'common': '<title>拆迁还建</title>\n\t' +
        '<meta name="keywords" content="拆迁还建"/>\n\t' +
        '<meta name="description" content="拆迁还建"/>'
    },
    'en': {
        'common': '<title>Demolition was also built </title>\n\t' +
        '<meta name="keywords" content="Demolition was also built "/>\n\t' +
        '<meta name="description" content="Demolition was also built "/>'
    }
}


// 接口入口 配置
var Entry = {
    'PORT': 5252,
    'RETRIES': 2,// 请求API失败后,重试的次数
}

var Config = {
    Constant: Constant,
    DataDisks: DataDisks,
    PageMeta: PageMeta,
    Entry: Entry
}
module.exports = Config