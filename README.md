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












