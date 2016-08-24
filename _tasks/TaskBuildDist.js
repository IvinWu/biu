var fs           = require('fs'),
    path         = require('path'),
    webpack      = require('gulp-webpack'),
    gulp         = require('gulp'),
    uglify       = require('gulp-uglify'),
    RevAll       = require('gulp-rev-all'),
    revDel       = require('gulp-rev-delete-original'),
    del          = require('del'),
    less         = require('gulp-less'),
    gulpsync     = require('gulp-sync')(gulp),
    cssnano      = require('gulp-cssnano'),
    gutil        = require('gulp-util'),
    htmlmin      = require('gulp-htmlmin'),
    fontSpider   = require('gulp-font-spider'),
    colors       = require('colors'),
    spritesmith  = require('gulp.spritesmith'),
    through      = require('through2'),
    gulpif       = require('gulp-if'),
    merge        = require('merge-stream'),
    buffer       = require('vinyl-buffer'),
    fileinclude  = require('gulp-file-include'),
    inlinesource = require('gulp-inline-source');

module.exports = function (gulp, config, webpackConfig) {

    //目录定义
    var paths = {
        //源码目录
        src: {
            root: '../../src/',
            dir: '../../src/' + config.projectName,
            img: 'img/**/**',
            imgIgnore: 'img/__ignore/**',
            sprite: 'img/sprite/',
            css: 'css/**',
            js: 'js/**',
            font: 'font/',
            html: '**/*.{html,php}',
            lib: {
                img: '../img/**',
                css: '../css/**',
                js: '../js/**'
            }
        },
        //发布目录
        dist: {
            root: '../../dist/',
            dir: '../../dist/' + config.projectName + '/',
            css: '../../dist/' + config.projectName + '/css/',
            js: '../../dist/' + config.projectName + '/js/',
            img: '../../dist/' + config.projectName + '/img/',
            sprite: '../../dist/' + config.projectName + '/img/sprite/',
            font: '../../dist/' + config.projectName + '/font/',
            html: '../../dist/' + config.projectName + '/**/*.{html,php}'
        }
    };

    //清空开发目录
    gulp.task('clear-dist', function () {
        return del(paths.dist.dir + "/**", {force: true});
    });

    //构建发布目录-项目图片（非雪碧图）
    gulp.task('dist-img', function () {
        return gulp.src([
                paths.src.img,
                '!' + paths.src.sprite,
                '!' + paths.src.sprite + '**',
                '!' + paths.src.imgIgnore
            ])
            .pipe(gulp.dest(paths.dist.img))

    });

    // 构建雪碧图，及对应替换关系（png和jpg）
    gulp.task('dist-sprite-png', function () {
        return dist_sprite('png')
    });
    gulp.task('dist-sprite-jpg', function () {
        return dist_sprite('jpg')
    });

    function dist_sprite(type) {
        var spriteData = gulp.src(paths.src.sprite + '**/*.' + type).pipe(spritesmith({
            imgName: 'sprite.' + type,
            cssName: 'sprite.' + type + '.json',
            cssTemplate: function (data) {
                var res = [];
                data.sprites.forEach(function (sprite) {
                    res.push({
                        "key": sprite.name,
                        "value": "background-repeat:no-repeat;background-image: url(../img/sprite/" + sprite.escaped_image + ");background-position: " + sprite.px.offset_x + " " + sprite.px.offset_y
                    })
                });
                return JSON.stringify(res);
            }
        }));

        var cssStream = spriteData.css
            .pipe(gulp.dest(paths.src.sprite));

        var imgStream = spriteData.img
            .pipe(buffer())
            .pipe(gulp.dest(paths.dist.sprite));

        return merge(imgStream, cssStream);
    }

    // 替换雪碧图路径（png和jpg）
    gulp.task('replace-sprite-data-png', function () {
        return replace_sprite_data('png')
    });
    gulp.task('replace-sprite-data-jpg', function () {
        return replace_sprite_data('jpg')
    });

    function replace_sprite_data(type) {
        if (!fs.existsSync(paths.src.sprite + 'sprite.' + type + '.json')) {
            return false;
        }
        var c = fs.readFileSync(paths.src.sprite + 'sprite.' + type + '.json', 'utf8');
        c     = JSON.parse(c);
        return gulp.src(paths.dist.css + '**')
            .pipe(
                through.obj(function (file, enc, callback) {
                    if (file.isNull()) {
                        return callback(null, file);
                    }
                    if (file.isStream()) {
                        return callback(null, file);
                    }
                    file = function (file, enc) {
                            var content = file.contents.toString();
                            for (var i = 0; i < c.length; i++) {
                                var re  = new RegExp("background-image:(\\s*)url\\([\'|\"]?(\\.\\.)?\/img\/sprite\/" + c[i].key + "\." + type + "[\'|\"]?\\)", "gi");
                                content = content.replace(re, c[i].value);
                            }
                            file.contents = new Buffer(content);
                        }(file, enc) || file;
                    callback(null, file);
                })
            )
            .pipe(gulp.dest(paths.dist.css))
    }

    // 删除雪碧图对应关系的json
    gulp.task('del-sprite-json', function () {
        return del([
            paths.src.sprite + 'sprite.png.json',
            paths.src.sprite + 'sprite.jpg.json'
        ], {force: true});
    });

    //构建发布目录-项目css
    gulp.task('dist-css', function () {
        return gulp.src(paths.src.css)
            .pipe(less({relativeUrls: true}))
            .pipe(cssnano({
                autoprefixer: {
                    browsers: [
                        'last 2 versions',
                        'safari >= 8',
                        'ie >= 10',
                        'ff >= 20',
                        'ios 6',
                        'android 4'
                    ]
                }
            }))
            .pipe(gulp.dest(paths.dist.css))
    });

    //转移项目font到dist中
    gulp.task('dist-move-font', function () {
        return fs.readdirSync(paths.src.font).length && gulp.src(paths.src.font + '**')
                .pipe(gulp.dest(paths.dist.font));
    });

    //构建发布目录-项目font
    gulp.task('dist-font', function () {
        return fs.existsSync(paths.dist.font) &&
            gulp.src(paths.dist.html)
                .pipe(fontSpider({
                    silent: false,
                    map: [
                        ['/css/', paths.dist.css],
                        ['/font/', paths.dist.font]
                    ]
                }));
    });

    //构建发布目录-项目JS
    gulp.task('dist-js', function () {
        return gulp.src(paths.src.js)
            .pipe(
                gulpif(
                    config.webpack,
                    webpack(
                        webpackConfig.init(true, config)
                        , null
                        , function (err, stats) {
                            if (stats.compilation.errors.length) {
                                //如果webpack构建失败（如js文件有语法问题），则终止流程
                                console.error(('子任务dist-js执行出错，报错信息如下：').red);
                                throw new gutil.PluginError("webpack", stats.compilation.errors[0].message);
                            }
                        }
                    )
                )
            )
            .pipe(uglify())
            .pipe(gulp.dest(paths.dist.js));
    });

    //构建发布目录-项目html
    gulp.task('dist-html', function () {
        return gulp.src(paths.src.html)
            .pipe(fileinclude({
                prefix: '@@',
                basepath: '@file'
            }))
            .pipe(htmlmin({collapseWhitespace: true, removeComments: true, minifyJS: true}))
            .pipe(gulp.dest(paths.dist.dir));
    });

    //将发布目录的文件版本化
    gulp.task('md5', function () {
        var revAll = new RevAll({
            fileNameManifest: 'manifest.json',
            dontRenameFile: ['.html', '.php'],
            //如果cdn开关没启用，则资源路径全部换成相对路径
            prefix: config.cdn ? config.cdn + config.projectName + '/' : './',
            annotator: function (contents, path) {
                return [{'contents': contents}];
            },
            replacer: function (fragment, replaceRegExp, newReference, referencedFile) {
                //插件作者留下的坑，详情看
                //https://github.com/smysnk/gulp-rev-all/issues/106
                if (referencedFile.revFilenameExtOriginal === '.js' && !replaceRegExp.toString().match(/\.js/)) {
                    return;
                }
                fragment.contents = fragment.contents.replace(replaceRegExp, '$1' + newReference + '$3$4');
            }
        });

        return gulp.src(paths.dist.dir + '/**')
            .pipe(revAll.revision())
            .pipe(gulp.dest(paths.dist.dir))
            .pipe(revDel({
                exclude: /(.html|.htm|.php)$/
            }))
            .pipe(revAll.manifestFile())
            .pipe(gulp.dest(paths.dist.dir));
    });

    //内联资源文件到html
    gulp.task('inline-source', function () {
        return gulp.src(paths.dist.html)
            .pipe(inlinesource())
            .pipe(gulp.dest(paths.dist.dir))

    });

    //整体构建发布目录
    gulp.task('build-dist', gulpsync.sync([
        'clear-dist',
        [
            'dist-img',
            'dist-sprite-png',
            'dist-sprite-jpg',
            'dist-css',
            'dist-js',
            'dist-html',
            'dist-move-font'
        ],
        'replace-sprite-data-png',
        'replace-sprite-data-jpg',
        'dist-font',
        'inline-source',
        'md5',
        'del-sprite-json'
    ]));
};