/**
 * @file 日志模块
 * @author mj(zoumiaojiang@gmail.com)
 */

define(function (require) {

    var log = {};


    /**
     * log等级定义
     *
     * @type {Array}
     */
    var levelMap = [
        'info',
        'notice',
        'warm',
        'error'
    ];


    /**
     * 设置一个阀值
     *
     * @type {Number}
     */
    log.level = 0;

    $('#info').click(function () {
        $('#command')[0].focus();
    });


    /**
     * 十进制补0
     *
     * @param  {number} num 待补的数字
     * @return {string}     补完0之后的字符串
     */
    function paddingZero(num) {
        return num < 10 ? '0' + num : num; 
    }


    /**
     * 判断filter开关是否打开
     *
     * @param  {number}  level log级别
     * @return {Boolean}       判断的结果
     */
    function isOpen(level) {
        if (level >= 0 && level < levelMap.length) {
            return $('#log-' + levelMap[level] + '-item').find('input')[0].checked;
        }

        return false;
    }


    /**
     * 展现log的具体操作
     * 
     * @inner
     * @param {string} msg   所要展现的log的内容
     * @param {number} level 所要展现的log的层级
     */
    function addInfo(msg, level) {
        var cmdPanel = $('#info ul');
        if (level >= log.level) {

            var time = new Date();
            var hours = paddingZero(time.getHours());
            var minutes = paddingZero(time.getMinutes());
            var seconds = paddingZero(time.getSeconds());
            var millSeconds = time.getMilliseconds();
            var timeStr =  hours + ':' + minutes + ':' + seconds + '.' + millSeconds;

            cmdPanel.find('.last').remove();
            cmdPanel.append(''
                + '<li '
                +     'data-level="' + level + '" '
                +     'class="log-' + levelMap[level] + '" '
                +     (!isOpen(level) && 'style="display:none;"')
                + '>'
                +     '~ <i>' + levelMap[level] + '</i> '
                +     msg + ' '
                +     '<em>--' + timeStr + '</em>'
                + '</li>'
                + '<li class="last">~ <input type="text" id="command" readonly="true"/></li>'
            );

            $('#command')[0].focus();
        }
    }


    /**
     * info log
     *
     * @param  {string} msg log内容
     */
    log.info = function (msg) {
        addInfo(msg, 0);
    };


    /**
     * nitice log
     *
     * @param  {string} msg log内容
     */
    log.notice = function (msg) {
        addInfo(msg, 1);
    };


    /**
     * warming log
     *
     * @param  {string} msg log内容
     */
    log.warm = function (msg) {
        addInfo(msg, 2);
    };


    /**
     * error log
     *
     * @param  {string} msg log内容
     */
    log.error = function (msg) {
        addInfo(msg, 3);
    };

    return log;
});
