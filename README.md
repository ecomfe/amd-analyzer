AMD Analyzer
=====================

一个chrome extension，可以分析页面中的AMD module之间的依赖关系，也能找出当前页面中的amd相关错误。


### 安装

由于可能添加新功能，所以推荐通过github，从源码安装。

#### Step 1

```
$ git clone https://github.com/ecomfe/amd-analyzer.git
```

#### Step 2

打开chrome的插件页面：[chrome://extensions](chrome://extensions)

#### Step 3

点击`加载正在开发的应用程序`

![step3](http://boscdn.bpc.baidu.com/mms-res/amd/install.png)

#### Step 4

选择`Step 1`中clone到的目录

安装完之后，我们可以看到如下所示：
![step4](http://boscdn.bpc.baidu.com/mms-res/amd/app.png)


#### step 5

访问一个开发中或线上的url, 如果当前页面中含有amd环境，将会出现下图所示的icon

![step5](http://boscdn.bpc.baidu.com/mms-res/amd/enter.png)

点击icon将会进入amd-analyzer分析页面。页面分为两个部分，左边的分析区和右边 的log区

下图为分析区的初始状态， 红色按钮中的模块为inline script中的入口模块， 绿色按钮为在某文件中的入口模块, 蓝色按钮为require.config信息
![enter modules](http://boscdn.bpc.baidu.com/mms-res/amd/entermodules.png)
![enter modules](http://boscdn.bpc.baidu.com/mms-res/amd/entermodules2.png)

下图为log区的初始状态，log区的日志支持filter过滤
![log](http://boscdn.bpc.baidu.com/mms-res/amd/info.png)


#### step 6

点击每个按钮，能分别看到分析的结果，如果在分析中有错误，会显示在右边。

下图为点击config获取的当前页面的require.config信息
![require.config](http://boscdn.bpc.baidu.com/mms-res/amd/config.png)

下图是点击某个入口模块的依赖分析图（默认是不分析状态，需要点击入口模块，相当于指定入口）
![analyse](http://boscdn.bpc.baidu.com/mms-res/amd/analyse.png)


#### 最后

可以根据右边的log区的日志，进行分析，定位问题。


### 说明

#### 关于装载时依赖

```javascript
// a是装载时依赖，b是运行时依赖
define( [ 'a', 'b' ], function ( a ) {} );

// a是装载时依赖，b是运行时依赖
define( function ( require ) {
    var a = require( 'a' );
    return function () {
        var b = require( 'b' );
    };
} );
```

#### 关于入口模块

入口模块指的是页面中以async方式调用的require。

```javascript
require( [ 'main' ], function ( main ) {
    main.init();
});
```












