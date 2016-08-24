var gulp     = require('gulp'),
    gutil    = require('gulp-util'),
    ftp      = require('vinyl-ftp'),
    gulpsync = require('gulp-sync')(gulp);


module.exports = function (gulp, config, webpackConfig) {
    //目录定义
    var paths = {
        //发布目录
        dist: {
            root: '../../dist/',
            dir: '../../dist/' + config.projectName + '/',
            css: '../../dist/' + config.projectName + '/css/',
            js: '../../dist/' + config.projectName + '/js/',
            img: '../../dist/' + config.projectName + '/img/'
        }
    };

    //ftp配置
    var conn = ftp.create({
        host: config.ftp.host,
        user: config.ftp.user,
        pass: config.ftp.pass,
        parallel: 10,
        log: gutil.log
    });

    //将发布目录中的模板文件传到FTP上
    gulp.task('ftp_template', function () {
        return gulp.src(paths.dist.dir + '**/*.*', {buffer: false})
            .pipe(conn.differentSize(config.ftp.dest))
            .pipe(conn.dest(config.ftp.dest));
    });

    gulp.task('ftp', gulpsync.sync([
        'build-dist',
        'ftp_template'
    ]));

};