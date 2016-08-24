//零、以下是一些JS方面的示例和技巧，在仔细阅读后，请清空本文件



//一、引用lib的方法（lib库相关文件在 /trunk/src/js/lib/ 中）
var qrcode = require('lib/qrcodejs/qrcode');
//如果该库需要引入到全局环境，则使用：
require('script!lib/vuejs/vue');
// => execute vue.js once in global context



//二、引入mod的方法（mod库相关文件在 /trunk/src/js/mod/ 中）
var wxShare = require('mod/wxShare');
//这是微信分享组件的事例，具体每个库的使用方法可以查看对应文件的注释或文档
wxShare(
    '标题标题',
    '描述~~~',
    'http://path/to/shareicon.png/',
    'http://www.qq.com',
    function(){$$.report('keypoint',id)}, //分享到朋友圈上报
    function(){$$.report('keypoint',id)}  //分享给好友上报
);



//三、引入html模板——handlebars的方法（html的模板统一放在对应项目的template文件夹下）
var template = require('../template/components.handlebars');
var html = template({
    title: 'demo示例',
    list: [{
        id: 1,
        name: "test1"
    }, {
        id: 2,
        name: "test2"
    }]
});
//自动引入zepto，请放心直接使用 $ 选择器
$('body').html(html);



//四、异步加载JS的方法
require.ensure(["test"], function(require){
    //只有运行到这个地方的时候，才会发出http请求，下载test.js文件
    var a = require('test');
    a();
});



//五、项目内JS统一支持es6语法，可以放心使用，举例
let a = 1;
let b = 2;

//交换a和b的值
[a, b] = [b, a];

console.log(a);
console.log(b);
//更多es6的语法知识，可看这本书：《ECMAScript 6入门》 http://es6.ruanyifeng.com/



