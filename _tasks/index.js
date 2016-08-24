var fs = require('fs');
var path = require('path');

var defaultConfig = require('rc')('config');
defaultConfig.projectName = process.cwd().split(path.sep).pop();
defaultConfig.rtx = fs.readFileSync('../../.rtx', 'utf8');

var config = require('rc')('project', defaultConfig);

module.exports = function (gulp, webpackConfig) {
    var start = new Date().getTime();
    fs.readdirSync(__dirname).filter(function (file) {
        return file.indexOf('Task') === 0;
    }).forEach(function (file) {
        var registerTask = require(path.join(__dirname, file));
        registerTask(gulp, config, webpackConfig);
    });
    var end = new Date().getTime();
    console.log('init tasks took ' + (end - start) + ' ms.');
};