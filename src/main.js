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

    var config;

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
        config = info.config;
        amd.initConfigIndex( info.config );


        var ul = document.querySelector( '.header ul' );
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

        document.getElementById( 'config' ).onclick = function () {
            var panel = document.querySelector( '.config-panel' );
            document.querySelector( '.config-panel textarea' ).value = JSON.stringify( config, null, 4 );
            panel.style.display = panel.style.display == 'none' ? '' : 'none';
        };

        document.querySelector( '.config-panel button' ).onclick = function () {
            var confString = document.querySelector( '.config-panel textarea' ).value;
            var conf = require( './ast2obj' )( esprima.parse( '(' + confString + ')' ).body[0].expression );
            amd.initConfigIndex( conf );
            config = conf;

            document.querySelector( '.config-panel' ).style.display = 'none';
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
