/**
 * @file 开始干活
 * @author mj(zoumiaojiang@gmail.com)
 */

(function () {

    var body = document.getElementsByTagName('body')[0];

    /**
     * 往目标页面注入脚本
     */
    function injectScript() {

        // 将action/inject.js注入到目标页面中，完成一些runtime的分析
        var injectSrc = chrome.extension.getURL('inject.js');
        var script = document.createElement('script');
        script.src = injectSrc;
        body.appendChild(script);
    }


    /**
     * 获取页面中所有的js文件路径
     *
     * @return {Array} js文件列表
     */
    function getScriptsInfo() {

        var reg = /("([^\\\"]*(\\.)?)*")|('([^\\\']*(\\.)?)*')|(\/{2,}.*?(\r|\n))/g; // 注释正则 
        var scripts = document.getElementsByTagName('script');
        var scriptSrcs = [];
        var inlineScripts = [];
        var asyncSrcs = [];

        for (var i = 0, len = scripts.length - 1; i < len; i++) {

            var script = scripts[i];
            var src = script.src;
            var content = script.text;
            if (src) {
                if (script.async) {
                    asyncSrcs.push({
                        src: src,
                        id: script.getAttribute('data-require-id')
                    });
                }
                else {
                    if (!(/(esl|requirejs)/g).test(src)) {
                        scriptSrcs.push({
                            src: src
                        });
                    }
                }
            }
            else {
                // 这里我们只取和amd相关的inline的js代码～～
                if ((/(require|define)\s*?[\(\.]/g).test(content)) {
                    inlineScripts.push(content);
                }
            }
        }

        return {

            // 从注入js取到的dom中获取baseUrl
            info: document.getElementById('amd-analyzer-dom').getAttribute('data-amd'),

            // 外引的js
            scriptSrcs: scriptSrcs,

            // 异步引入的js
            asyncSrcs: asyncSrcs,

            // inline的js代码
            inlineScript: inlineScripts.join('')
                .replace(reg, function (code) { // 去除注释后的文本  
                    return /^\/{2,}/.test(code) ? '' : code;
                })
                .replace(/[\n\t\r\b]/g, '')
        };
    }



    /**
     * 判断当前页面是否是amd环境
     */
    function judgeHasAmd() {

        // 等待原始页面的inject的js做判断更新dom之后， 100ms应该够用了
        setTimeout(function () {
            if (+document.getElementById('amd-analyzer-dom').getAttribute('ret') === 1) {
                // 为了控制page_action的icon展现
                chrome.extension.connect().postMessage({
                    actionName: 'tobackgroundpage'
                });
            }
        }, 100);
    }


    injectScript();
    judgeHasAmd();

    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            sendResponse(getScriptsInfo());
        }
    );

})();
