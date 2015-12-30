/**
 * @file 获取代码
 * @author mj(zoumiaojiang@gmail.com)
 */

define(function (require) {

    var log = require('../common/log');


    /**
     * async script代码map
     *
     * @type {Object}
     */
    var codeMap = {};


    /**
     * 同步请求js文件内容
     *
     * @param  {Array} srcs js文件列表
     */
    function getCode(srcs) {

        srcs.forEach(function (item) {
            var url = item.src;

            // 首先排除掉烂七八糟的请求
            if (!/(chrome|file)/g.test(url)) {

                // 如果是使用//形式加载的资源，给他们补上http
                if (!/^(http|https)/g.test(url)) {
                    url = 'http:' + url;
                }
                try {
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', url, false);
                    xhr.send();
                    if (xhr.status >= 200 && xhr.status < 300) {
                        codeMap[url] = {
                            id: item.id,
                            code: xhr.responseText
                        };
                    }
                    if (xhr.status == 404) {
                        log.error(''
                            + '检查模块"' + item.id + '"不存在或config配错错误。'
                            + '<a href="'+url+'" target="_blank">file not found</a>'
                        )
                    }
                }
                catch (ex) {
                    log.error(url + '文件下载失败');
                    log.error(ex);
                }
            }
        });

        return codeMap;
    }


    return {
        getCode: getCode
    };

});
