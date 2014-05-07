/**
 * @file 分析器页面启动主模块
 * @author errorrik(errorrik@gmail.com)
 */

define( function ( require ) {

    var amd = require( './amd' );
    var analyse = require( './analyse' );

    /**
     * 初始化，向目标页面发送消息，获取页面的inline script source
     */
    function init() {
        var tabId = parseInt( location.hash.slice( 1 ), 10 );
        chrome.tabs.get( tabId, function ( tab ) {
            amd.setPageUrl( tab.url.replace(/#[^#]+$/, '').replace(/\?[^\?]+$/, '') );
            chrome.tabs.sendMessage( tabId, {}, messageCallback );
        })
    }

    /**
     * 目标页面消息回调函数
     *
     * @inner
     * @param {string|boolean} data 目标页面的inline script source
     */
    function messageCallback( data ) {
        if ( data === false ) {
            notice( 'This page not use AMD.' );
            return;
        }

        var info = require( './parse-page-script' )( data );
        amd.initConfigIndex( info.config );

        var ul = document.querySelector( '#header ul' );
        for ( var id in info.entries ) {
            var li = document.createElement( 'li' );
            li.innerHTML = id;
            li.setAttribute( 'data-realid', amd.normalize( id ) );
            li.onclick = createAnalyzer( id );
            ul.appendChild( li );
        }

        document.getElementById( 'analyse-start' ).onclick = function () {
            analyseModule( document.getElementById( 'analyse-id' ).value );
        };
    }

    /**
     * 分析模块，并显示分析结果
     *
     * @inner
     * @param {string} id 模块id
     */
    function analyseModule( id ) {
        analyse( id );
        require( './display-list' )( id );
        require( './display-chart' )( id );
    }

    /**
     * 创建模块分析函数
     *
     * @inner
     * @param {string} id 模块id
     * @return {Function}
     */
    function createAnalyzer( id ) {
        return function () {
            document.getElementById( 'analyse-id' ).value = id;
            analyseModule( id );
        };
    }

    return {
        init: init
    };
});
