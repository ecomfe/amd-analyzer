AMD Analyzer
=====================

一个chrome extension，可以分析页面中的AMD module之间的依赖关系。


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

当前暂时只能自动分析页面中字面调用的async require。下面的代码无法自动分析，可以在输入框中手工输入入口模块。

```javascript
var entries = [ 'main' ];
require( entries, function ( main ) {
    main.init();
});
```

#### 加载器配置(require.config)

分析器暂时只支持自动分析页面inline script中的`require.config`调用。如果require.config在外部script中，请点击右上角的`齿轮图标`，手工输入加载器配置。











