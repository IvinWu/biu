var fs          = require('fs'),
    path        = require('path'),
    gulp        = require('gulp'),
    webpack     = require('gulp-webpack'),
    del         = require('del'),
    less        = require('gulp-less'),
    gulpsync    = require('gulp-sync')(gulp),
    gutil       = require('gulp-util'),
    colors      = require('colors'),
    gulpif      = require('gulp-if'),
    bs          = require('browser-sync').create(),
    fileinclude = require('gulp-file-include'),
    sourcemaps  = require('gulp-sourcemaps');

module.exports = function (gulp, config, webpackConfig) {

    //目录定义
    var paths = {
        //源码目录
        src: {
            root: '../../src/',
            dir: '../../src/' + config.projectName,
            img: 'img/**/*.*',
            css: 'css/**',
            js: 'js/**',
            font: 'font/**',
            html: '**/*.{html,php}',
            template: 'template/**',
            lib: {
                css: '../css/**',
                js: '../js/**'
            }
        },
        //开发目录
        dev: {
            root: '../../dev/',
            dir: '../../dev/' + config.projectName + '/',
            css: '../../dev/' + config.projectName + '/css/',
            js: '../../dev/' + config.projectName + '/js/',
            img: '../../dev/' + config.projectName + '/img/',
            font: '../../dev/' + config.projectName + '/font/'
        }
    };

    //清空开发目录
    gulp.task('clear-dev', function () {
        return del(paths.dev.dir + "/**", {force: true});
    });

    //构建开发环境-项目JS
    gulp.task('dev-js', function () {
        return gulp.src(paths.src.js)
            .pipe(
                gulpif(
                    config.webpack,
                    webpack(
                        webpackConfig.init(false, config)
                        , null
                        , function (err, stats) {
                            if (stats.compilation.errors.length) {
                                //如果webpack构建失败（如js文件有语法问题），则终止流程
                                console.error(('子任务dev-js执行出错，报错信息如下：').red);
                                throw new gutil.PluginError("webpack", stats.compilation.errors[0].message);
                            }
                        }
                    )
                )
            )
            .pipe(gulp.dest(paths.dev.js));
    });

    //构建开发环境-项目css
    gulp.task('dev-css', function () {
        return gulp.src(paths.src.css)
            .pipe(sourcemaps.init())
            .pipe(less({relativeUrls: true}))
            .pipe(sourcemaps.write())
            .pipe(gulp.dest(paths.dev.css));
    });

    //构建开发环境-项目图片
    gulp.task('dev-img', function () {
        return gulp.src(paths.src.img)
            .pipe(gulp.dest(paths.dev.img));
    });

    //构建开发环境-项目字体
    gulp.task('dev-font', function () {
        return gulp.src(paths.src.font)
            .pipe(gulp.dest(paths.dev.font));
    });

    //构建开发环境-项目html
    gulp.task('dev-html', function () {
        return gulp.src(paths.src.html)
            .pipe(fileinclude({
                prefix: '@@',
                basepath: '@file'
            }))
            .pipe(gulp.dest(paths.dev.dir));
    });

    //开启本地服务器，预览页面
    gulp.task('startServer', function () {
        if (!config.livereload) {
            return false;
        }

        var startPath = fs.readdirSync(paths.dev.dir).filter(function (file) {
            return file.indexOf(".html") > 0;
        }).sort(function (a, b) {
            //优先级（最后的优先）
            var priority = [
                'default.html',
                'index_tmpl.html',
                'index.html'
            ];
            return priority.indexOf(b) - priority.indexOf(a);
        });

        return bs.init({
            server: paths.dev.dir,
            port: 80,
            startPath: startPath[0],
            reloadDelay: 0,
            notify: {      //自定制livereload 提醒条
                styles: [
                    "margin: 0",
                    "padding: 5px",
                    "position: fixed",
                    "font-size: 10px",
                    "z-index: 9999",
                    "bottom: 0px",
                    "right: 0px",
                    "border-radius: 0",
                    "border-top-left-radius: 5px",
                    "background-color: rgba(60,197,31,0.5)",
                    "color: white",
                    "text-align: center"
                ]
            }
        });
    });

    //监听图片和字体文件，变化时拷贝到开发环境
    gulp.task('watch-static', function () {
        return gulp.watch([paths.src.img, paths.src.font], function (event) {
            console.log(event);
            var distPath = paths.dev.dir + path.relative(paths.src.dir, path.dirname(event.path));
            gulp.src(event.path)
                .pipe(gulp.dest(distPath))
                .on('end', reloadHandler);
        })
    });

    //监听html，变化时做include处理，拷贝到开发环境
    gulp.task('watch-html', function(){
        return gulp.watch([paths.src.html, paths.src.template], function () {
            gulp.src(paths.src.html)
                .pipe(fileinclude({
                    prefix: '@@',
                    basepath: '@file'
                }))
                .pipe(gulp.dest(paths.dev.dir))
                .on('end', reloadHandler);
        })
    });

    //监听JS资源，变化时重新编译并拷贝到开发环境
    gulp.task('watch-js', function () {
        return gulp.watch(paths.src.js, function (event) {
            console.log(event);
            gulp.src(paths.src.js)
                .pipe(
                    gulpif(
                        config.webpack,
                        webpack(
                            webpackConfig.init(false, config)
                            , null
                            , function (err, stats) {
                                if (stats.compilation.errors.length) {
                                    //如果webpack构建失败（如js文件有语法问题），则终止流程
                                    throw new gutil.PluginError("webpack", stats.compilation.errors[0].message);
                                }
                            }
                        )
                    )
                )
                .pipe(gulp.dest(paths.dev.js))
                .on('end', reloadHandler);
        })
    });

    //监听css资源，变化时重新编译并拷贝到开发环境
    gulp.task('watch-css', function () {
        return gulp.watch(paths.src.css, function (event) {
            console.log(event);
            var distPath = paths.dev.dir + path.relative(paths.src.dir, path.dirname(event.path));
            gulp.src(event.path)
                .pipe(sourcemaps.init())
                .pipe(less({relativeUrls: true}))
                .pipe(sourcemaps.write())
                .pipe(gulp.dest(distPath))
                .on('end', reloadHandler);
        })
    });

    //刷新浏览器
    function reloadHandler() {
        config.livereload && bs.reload();
    }

    //整体构建开发目录
    gulp.task('build-dev', gulpsync.sync([
        'clear-dev',
        [
            'dev-js',
            'dev-css',
            'dev-img',
            'dev-font',
            'dev-html'
        ]
    ]));

    //整体构建开发目录并监听所有文件
    gulp.task('watch', gulpsync.sync([
            'build-dev',
            'startServer',
            [
                'watch-static',
                'watch-html',
                'watch-js',
                'watch-css'
            ]
        ])
    );
};
