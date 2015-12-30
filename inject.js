/**
 * @file 介入页面的javascript的runtime, 并且和content_script通信
 *       content_script和页面的js环境是隔离的，只能依靠dom以及事件进行通用
 *       在这个注入的js中不宜干很多事情，因为会污染原用户页面，迫不得已不在这里做事情
 * @author mj(zoumiaojiang@gmail.com)
 */

(function (root) {

    /**
     * 判断页面中是否存在amd并用dom和content_script通信
     */
    function hasAmd() {

        if (typeof define === 'function'
            && define.amd
            && require.config
            && typeof require.config === 'function'
        ) {
            return true;
        }
        return false;
    }


    /**
     * 判断是否在amd环境中，只能借助dom通信了
     */
    function judgeEnv() {
        var div = document.createElement('div');
        div.id = 'amd-analyzer-dom';

        // 通知background开始干活
        if (hasAmd()) {

            var obj = {
                baseUrl: require.toUrl ? require.toUrl(): '',
                host: location.host,
                protocol: location.protocol
            }

            // 标示是amd环境
            div.setAttribute('ret', 1);

            // 指定当前页面的baseUrl
            div.setAttribute('data-amd', JSON.stringify(obj));
        }
        else {
            div.setAttribute('ret', 0);
        }

        document.getElementsByTagName('body')[0].appendChild(div);
    }

    judgeEnv();

})(this);
