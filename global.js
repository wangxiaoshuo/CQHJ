/**
 * Created by Administrator on 2017/8/10.
 */
'use strict';

var _ = require('lodash')

module.exports = function(){
    var global_ = {
        //正式
        WEIXIN_APPID: 'wx07094462a0e56893',
        WEIXIN_APPSECRET: '8949a64a0b432f996080d461a3d8a862',
        //铁塔消息模板
        /*WEIXIN_TEMPLATE_ID : "eylBwiWbHD8dbWkeaNQYuqsu-Askls2PqA_vMjusOx8",*/
        //拆迁还建消息模板
        WEIXIN_TEMPLATE_ID : "QR1llw5GNhNXghcGZbA5R9885E3zjOOlmK3BE9zLwDE",
        IS_PRODUCTION: 'production' === process.env.NODE_ENV,
        // 用户角色
        ACCOUNT_ROLE: {
            user: 0,//用户
            judge:1,//评委
            admin:2, //管理员
            superAdmin:10 //超级管理员
        },
        // 用户状态
        USER_STATUS: {
            refused: 0,//未过审核
            passed:1,//已通过
            examine:2, //审核中
        },
        //评委状态
        JUDGE_STATUS:{
          busy:1,//忙碌
          examine:2,//正在审核
          normal:3 //空闲状态
        },
        //项目状态
        PROJECT_STATUS:{
            enrolling:1,//正在报名
            enrolled:0,//报名结束 待审核
            /*verifying:2,//正在审核*/
            verified:3, //审核完成 结果待确认
            pz:4,//用户缴纳
            qr:5,//凭证待确认
            overtime:6,//上传超时
            success:7,//项目成功
            fail:8 //项目取消
        }
    }
    _.extend(global, global_)
}