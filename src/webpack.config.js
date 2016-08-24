var webpack = require('webpack');
var path    = require('path');
var fs      = require('fs');

module.exports = {
    init: function (is_release, config) {
        var entryList = (function () {
            var res = {};
            files   = fs.readdirSync('./js/');
            files.filter(function (file) {
                return path.extname(file) == '.js';
            }).forEach(function (file) {
                res[path.basename(file, '.js')] = './js/' + file;
            });
            return res;
        })();

        return {
            // 如果项目有多个HTML，就在这里配置js入口文件
            entry: entryList,
            output: {
                filename: '[name].js',
                publicPath: config.cdn ? (is_release ? config.cdn.perfix + config.projectName + '/js/' : '/js/') : './js/'
            },
            resolve: {
                // 模块的别名
                alias: {
                    lib: path.join(process.cwd(), "../js/lib")
                    , mod: path.join(process.cwd(), "../js/mod")
                    , zepto: path.join(process.cwd(), "../js/lib/zepto/1.1.6/zepto.min")
                    , wxJsSDK: path.join(process.cwd(), "../js/lib/weixinJsSDK/jweixin-1.0.0")
                },
                root: './js'
            },
            devtool: is_release ? "" : "#cheap-inline-source-map",
            module: {
                loaders: [
                    {
                        test: /\.json$/,
                        loader: "json"
                    }, {
                        test: /\.handlebars$/,
                        loader: "handlebars-loader"
                    }, {
                        test: /\.js$/,
                        loader: 'babel', // 'babel-loader' is also a legal name to reference
                        query: {
                            presets: ['es2015']
                        }
                    }
                ]
            },
            plugins: (function () {
                var res = [
                    new webpack.ProvidePlugin({
                        "$": "zepto"
                    })
                ];
                if (Object.keys(entryList).length > 1) {
                    //如果项目存在多于一个页面，则提取公共组件
                    res.push(
                        new webpack.optimize.CommonsChunkPlugin("common", 'common/common.js')
                    );
                }
                return res;
            })()
        }
    }
};