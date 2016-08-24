var gulp = require('gulp');
var fs = require('fs');
var path = require('path');
var webpackConfig = fs.existsSync('./webpack.config.js') ? require('./webpack.config.js') : require('../webpack.config.js');

//注册
var deep = 3;
run_tasks('_tasks');

function run_tasks(tasks_path) {
    if (--deep < 0) {
        throw new Error('something wrong in require tasks!');
    }

    tasks_path = path.join('../', tasks_path);

    if (fs.existsSync(tasks_path)) {
        require(tasks_path)(gulp, webpackConfig);
    } else {
        run_tasks(tasks_path);
    }
}