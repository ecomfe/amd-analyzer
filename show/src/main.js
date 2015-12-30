/**
 * @file 分析页面逻辑入口
 * @author mj(zoumiaojiang@gmail.com)
 */

define(function (require) {

    var exports = {};

    var amd = require('./parser/amd');
    var parseinlinescript = require('./parser/parseinlinescript');
    var draw = require('./draw');
    var codes = require('./parser/codes');
    var log = require('./common/log');
    var analyse = require('./parser/analyse');

    var settingFlag = false;
    var config;



    /**
     * 创建模块分析函数
     *
     * @inner
     * @param {string} id 模块id
     * @return {Function}
     */
    function createAnalyzer() {
        var id = $(this).data('id');
        var modules = analyse.getModules();

        $('#analyse-id')[0].value = id;
        if (modules.hasOwnProperty(id)) {
            draw(id);
        }
        else {
            log.error(id + '模块undefined或者id路径错误');
        }
    }


    /**
     * 冒泡找到含有class的dom
     *
     * @param  {Object} dom       dom object
     * @param  {string} classname class名
     * @return {Object}           最终确认的dom
     */
    function getTargetDom(dom, classname) {
        while(dom !== document) {
            if ($(dom).hasClass(classname)) {
                return dom;
            }
            else {
                dom = dom.parentNode;
            }
        }
    } 


    /**
     * 初始化log的filter
     *
     * @inner
     */
    function initFilter() {
        $('#log-filter').on('click', function (e) {
            var tar = e.target;
            var item = getTargetDom(tar, 'log-filter-item');

            if (tar.tagName.toLowerCase() === 'input') {
                item = tar.parentNode;
            }
            else if (item) {
                var checkbox = $(item).find('input')[0];
                checkbox.checked = !checkbox.checked;
            }

            if (item) {
                var $item = $(item);
                var level = $item.data('level');
                var flag = $item.find('input')[0].checked;
                doFilter(level, flag);
            }
        });
    }


    /**
     * 过滤log
     *
     * @param  {number} level log的level
     * @param  {boolean} flag  toggle是否隐藏？true: 隐藏
     */
    function doFilter(level, flag) {
        var infos = $('.log-info');
        var warms = $('.log-warm');
        var notices = $('.log-notice');
        var errors = $('.log-error');

        var list = [infos, notices, warms, errors];
        var item = list[+level];

        if (item.length > 0) {
            !flag ? item.hide() : item.show();
        }
    }


    /**
     * 绑定页面中的一些dom事件
     */
    function bindEvent() {

        $('#amdinfobtn').on('click', function () {
            var configDom = $('#config');
            $('#config textarea').val(JSON.stringify(config, null, 4));
            settingFlag ? configDom.hide() : configDom.show();
            settingFlag = !settingFlag;
        });

        // setting onblur
        $(document).on('click', function (e) {

            var tar = e.target;
            var tarWrap = getTargetDom(tar, 'config');
            var amdinfobtn = $('#amdinfobtn')[0];
            var configDom = $('#config');

            if (tar !== amdinfobtn && !tarWrap && settingFlag) {
                configDom.hide();
                settingFlag = false;
            }
        });

        // 点击了conf设置按钮
        $('#setting-btn').on('click', function () {

            var confString = $('#config textarea').val();
            try {
                var conf = require('./parser/ast2obj')(esprima.parse('(' + confString + ')').body[0].expression);
            }
            catch (ex) {
                log.error('config不符合规范');
                log.error(ex);
            }

            amd.initConfigIndex(conf);
            config = conf;

            $('#config').hide();
            settingFlag = false;
        });
    }


    /**
     * 展示页面的主模块入口
     */
    exports.start = function () {

        var tabId = parseInt(location.hash.slice(1), 10);

        chrome.tabs.get(tabId, function (tab) {
            var url = tab.url;
            tab.url.length > 50 && (url = tab.url.substring(0, 50) + ' …');
            $('#tabinfo').html(url).attr('href', tab.url);
            chrome.tabs.sendMessage(tabId, {}, messageCallback);
        });

        initFilter();
    };


    /**
     * 目标页面消息回调函数
     *
     * @inner
     * @param {string|boolean} data 目标页面的inline script source
     */
    function messageCallback(scripts) {

        if (!scripts) {
            log.error('插件或者页面挂了:)，重启一下<a href="chrome://extensions" target="_blank">chrome://extensions</a>');
            return;
        }
        else {
            log.info('初始化成功');
        }

        var inlineScript = scripts.inlineScript;
        var asyncSrcs = scripts.asyncSrcs;

        // 如果没有异步加载的js，并且是amd环境，就是入口那里搞错了。
        if (asyncSrcs.length === 0) {
            log.warm('没有发现异步加载的amd模块，请检查amd入口模块是否正确');
        }

        var syncSrcs = scripts.scriptSrcs;
        var ast = {};
        var tempSrcs = asyncSrcs.concat(syncSrcs);
        var codeMap = codes.getCode(tempSrcs);
        var sinfo = JSON.parse(scripts.info);
        var info;


        /**
         * 在外引代码中找找config
         */
        function findConfig() {
            for (var k in codeMap) {
                if (codeMap.hasOwnProperty(k)) {
                    var item = codeMap[k];
                    var tempInfo = parseinlinescript((item.code || ''), k);

                    if (JSON.stringify(tempInfo.entries) != '{}') {
                        for (var i in tempInfo.entries) {
                            if (tempInfo.entries.hasOwnProperty(i)) {
                                delete tempInfo.entries[i];
                                tempInfo.entries[amd.normalize(i, item.id)] = 2;
                            }
                        }
                    }
                    info = $.extend(true, {}, info, tempInfo);
                }
            }
        }

        info = parseinlinescript(inlineScript);
        findConfig();

        if (JSON.stringify(info.entries) == '{}') {
            log.error('没找到任何入口模块');
        }

        config = info.config;


        // 解析没出错的情况下
        if (+info.status === 0) {

            if (config.baseUrl === '') {
                config.baseUrl = sinfo.baseUrl;
            }

            if (!/^\s*?https?:\/\//g.test(config.baseUrl)) {
                config.baseUrl =  sinfo.protocol + '//' + sinfo.host + '/' + config.baseUrl;
            }

            log.info('baseUrl: ' + config.baseUrl);

            amd.initConfigIndex(config);
            
            // 先取到一份基于codeMap的modules map
            analyse.parse(codeMap);

            var ul = $('#analyse ul');
            for (var id in info.entries) {
                var li = document.createElement('li');
                li.innerHTML = id;
                if (info.entries[id] === 2) {
                    $(li).addClass('import-script');
                }
                li.setAttribute('data-realid', amd.normalize(id));
                li.setAttribute('data-id', id);
                li.onclick = createAnalyzer;
                ul.append(li);
            }

            bindEvent();
        }
    }


    return exports;
});
