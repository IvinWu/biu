# biu

##安装步骤
-	机器安装[node环境](https://nodejs.org)
-	拉取本框架
`git clone https://github.com/IvinWu/biu.git`
-	安装依赖
打开命令行（CMD或其他工具），在框架根目录下执行 `npm install`


##工具命令
###创建项目
####命令
```
gulp init -p <项目名字>
```
####举例
在`./src/`目录下，执行`gulp init -p justatest`
####说明
执行了命令后，`src`目录下会出现一个新的文件夹`justatest`，后续开发工作统一在此文件夹内进行
```
src/
│
├── css
├── js
├── project_tpl
└── justatest
	├── css					//项目css
	├── js					//项目js
	├── img					//项目img
	├── index.html    		//项目html
	├── gulpfile.js    		//配置文件
	├── .projectrc    		//配置文件
	└── webpack.config.js     //配置文件
```

###监听并构建项目，在本地测试
####命令
```
gulp watch
```
####举例
在`./src/justatest/`目录下，执行`gulp watch`
####说明
执行命令后，`dev`目录下会出现一个新的文件夹`justatest`，里面的代码经过了*编译*，可以使用浏览器直接访问
```
dev/
│
└── justatest
	├── css
	├── js
	├── img
	└── index.html
```
此时工具会自动打开浏览器，并访问到`dev`目录下的对应项目页面。
此时可以继续修改源码目录`src`中的文件，工具会自动执行构建命令，并自动刷新浏览器。

###发布到ftp
####命令
```
gulp ftp
```
####举例
在`./src/justatest/`目录下，执行`gulp ftp`
####说明
执行命令后，`dist`目录下会出现一个新的文件夹`justatest`，里面的代码经过了*编译、压缩、打包、签名*，可以直接用来发布
```
dist/
│
└── justatest
	├── css
	│	└── index.d5364e0d.css
	├── js
	│	└── common
	│		└── common.4d03219d.js
	├── img
	└── index.html
```
并且将上诉文件夹内的资源上传到了ftp。

##更多配置项说明
###全局配置文件.configrc
```javascript
{
  //ftp信息
  "ftp": {
    "host": "xx.xx.xx.xx",
    "user": "xxx",
    "pass": "xxx",
    //ftp默认传送的的路径
    "dest": "/"
  },
  //是否使用webpack
  "webpack": true
}
```

###项目配置文件.projectrc
```javascript
{
  //是否启用浏览器自动刷新
  "livereload":true,
  //是否使用webpack
  "webpack":true
}
```
项目配置文件会与全局配置文件合并，但项目配置文件的配置优先级会更高