'use strict';

var Config = require('./config.js')
var Constant = Config['Constant'] || {}
var IS_CONFUSION = Constant['IS_CONFUSION'] || false

module.exports = function (grunt) {
    var hbAttrWrapOpen =  /\{\{[^}]+\}\}/;
    var hbAttrWrapClose = /\{\{\/[^}]+\}\}/;
    var hbAttrWrapPair = [hbAttrWrapOpen, hbAttrWrapClose];

    grunt.initConfig({
        app: {
            controllers: 'controllers',
            lib: 'lib',
            models: 'models',
            uploads: 'uploads',
            node_modules: 'node_modules',
            default_views: 'views/default',
            default_public: 'public',
            default_common: '<%= app.default_public %>/common',
            default_common_js: '<%= app.default_public %>/common/js',
            default_lib: '<%= app.default_public %>/lib',
            default_upload: '<%= app.default_public %>/upload',
            default_build:'<%= app.default_public %>/build',
            default_web:'<%= app.default_public %>/web',
            default_locale:'<%= app.default_public %>/web/locale',
            default_target: '<%= app.default_public %>/target',
            default_target_css: '<%= app.default_public %>/target/css',
            default_target_js: '<%= app.default_public %>/target/js',
        },
        // TODO 待处理 因会自动复盖,暂缓清理功能
        uglify: {
            default_js: {
                options: {
                    report: 'min',
                    banner: '/*! 蜂鸟信息 Copyrights ©2013-2016  */\n'
                },
                files: [
                    {
                        expand: true,
                        // TODO 待处理 私有云部署仅支持接口、汇总页面和文档页面
                        src: IS_CONFUSION?[
                            '<%= app.controllers %>/lib/*.js',
                            '<%= app.controllers %>/router.js',
                        ]:
                            [
                                '<%= app.controllers %>/**/*.js'
                            ],
                        dest: 'dist'
                    },
                    {
                        expand: true,
                        src: [ '<%= app.lib %>/**/*.js', '<%= app.models %>/**/*.js'],
                        dest: 'dist'
                    }
                ]
            },

            upload_js: {
                options: {
                    report: 'min',
                    banner: '/*! 蜂鸟信息 Copyrights ©2013-2016  */\n'
                },
                src: [
                    '<%= app.default_common_js %>/upload.js'
                ],
                dest: '<%= app.default_target_js %>/upload.js'
            },

            pages_js: {
                options: {
                    report: 'min',
                    banner: '/*! 蜂鸟信息 Copyrights ©2013-2016  */\n'
                },
                src: [
                    '<%= app.default_common_js %>/pages.js'
                ],
                dest: '<%= app.default_target_js %>/pages.js'
            },
            utils_js: {
                options: {
                    report: 'min',
                    banner: '/*! 蜂鸟信息 Copyrights ©2013-2016  */\n'
                },
                src: [
                    '<%= app.default_lib %>/utils.js'
                ],
                dest: '<%= app.default_target_js %>/ui.js'
            },

            bind_js: {
                options: {
                    report: 'min',
                    banner: '/*! 蜂鸟信息 Copyrights ©2013-2016  */\n'
                },
                src: [
                    '<%= app.default_source_js %>/bind.js'
                ],
                dest: '<%= app.default_target_js %>/bind.js'
            },

            app: {
                options: {
                    report: 'min',
                    banner: '/*! 蜂鸟信息 Copyrights ©2013-2016  */\n'
                },
                src: 'app.js',
                dest: 'dist/app.js'
            },
            config: {
                options: {
                    report: 'min',
                    banner: '/*! 蜂鸟信息 Copyrights ©2013-2016  */\n'
                },
                src: 'config.js',
                dest: 'dist/config.js'
            },
            global: {
                options: {
                    report: 'min',
                    banner: '/*! 蜂鸟信息 Copyrights ©2013-2016  */\n'
                },
                src: 'global.js',
                dest: 'dist/global.js'
            },
            router_common: {
                options: {
                    report: 'min',
                    banner: '/*! 蜂鸟信息 Copyrights ©2013-2016  */\n'
                },
                src: 'router-common.js',
                dest: 'dist/router-common.js'
            }
        },
        // TODO 待处理 和模板不兼容
        htmlmin: {
            options: {
                removeComments: true, //清除HTML注释
                removeCommentsFromCDATA: true, //删除 script 和style标签内的HTML注释
                collapseWhitespace: true, //压缩HTML
                collapseBooleanAttributes: true, //省略布尔属性的值 <input checked="true"/> ==> <input />
                collapseInlineTagWhitespace: true, //display:inline 属性不间隙
                removeAttributeQuotes: true, //删除属性引号
                removeRedundantAttributes: true, //删除冗余属性
                useShortDoctype: true, //使用短文档类型声明
                removeEmptyAttributes: true, //删除所有空格作属性值 <input id="" /> ==> <input />
                removeOptionalTags: true, //删除可选标签
                keepClosingSlash: true, //保持反斜杠
                removeScriptTypeAttributes: true,//删除<script>的type="text/javascript"
                removeStyleLinkTypeAttributes: true,//删除<style>和<link>的type="text/css"
                minifyJS: true,//压缩页面JS
                minifyCSS: true,//压缩页面CSS
                // ignoreCustomFragments:  [hbAttrWrapPair]
                // customAttrSurround: [hbAttrWrapPair]


            },
            html: {
                files: [
                    // {expand: true, src: ['<%= app.default_views %>/**/*.html'], dest: 'dist'}
                ]
            }
        },
        copy: {
            // TODO 待处理 因压缩包太大,自主上网安装
            // node_modules: {
            //     files: [{expand: true, src: ['<%= app.node_modules %>/**'], dest: 'dist'}]
            // },
            default_common: {
                files: [{expand: true, src: ['<%= app.default_common %>/**'], dest: 'dist'}]
            },
            default_target: {
                files: [{expand: true, src: ['<%= app.default_target %>/**'], dest: 'dist'}]
            },

            // TODO 待处理 待压缩html功能完善后删除
            default_views: {
                // TODO 待处理 私有云部署仅支持接口、汇总页面和文档页面
                files: IS_CONFUSION?[
                    {expand: true, src: ['<%= app.default_views %>/layout.html'], dest: 'dist'},
                    {expand: true, src: ['<%= app.default_views %>/error.html'], dest: 'dist'},
                    {expand: true, src: ['<%= app.default_views %>/developer/doc.html'], dest: 'dist'},
                    {expand: true, src: ['<%= app.default_views %>/developer/faqDev.html'], dest: 'dist'},
                    {expand: true, src: ['<%= app.default_views %>/developer/faqUser.html'], dest: 'dist'},
                    {expand: true, src: ['<%= app.default_views %>/management/layout.html'], dest: 'dist'},
                    {expand: true, src: ['<%= app.default_views %>/management/summaries.html'], dest: 'dist'}
                ]:
                    [
                        {expand: true, src: ['<%= app.default_views %>/**'], dest: 'dist'}
                    ]
            },

            package: {
                files: [{expand: true, src: ['package.json'], dest: 'dist'}]
            },
            pm2: {
                files: [{expand: true, src: ['pm2.json'], dest: 'dist'}]
            },
            property: {
                files: [{expand: true, src: ['property.json'], dest: 'dist'}]
            }
        }
    })

    grunt.loadNpmTasks('grunt-contrib-uglify')
    grunt.loadNpmTasks('grunt-contrib-less')
    grunt.loadNpmTasks('grunt-contrib-htmlmin')
    grunt.loadNpmTasks('grunt-contrib-copy')

    grunt.registerTask('default', ['uglify', 'htmlmin', 'copy'])

}