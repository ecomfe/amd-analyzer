define( function ( require ) {

    var amd = require( './amd' );
    var analyse = require( './analyse' );

    function init() {
        var tabId = parseInt( location.hash.slice( 1 ), 10 );
        chrome.tabs.get( tabId, function ( tab ) {
            amd.setPageUrl( tab.url.replace(/#[^#]+$/, '').replace(/\?[^\?]+$/, '') );
            chrome.tabs.sendMessage( tabId, {}, messageCallback );
        })
    }

    var chart;
    var chartOptions = {
        series : [
            {
                type:'force',
                itemStyle: {
                    normal: {
                        label: {
                            show: true,
                            textStyle: {
                                color: '#333'
                            }
                        },
                        nodeStyle : {
                            brushType : 'fill',
                            strokeColor : 'rgba(255,215,0,0.4)',
                            lineWidth : 0
                        }
                    },
                    emphasis: {
                        label: {
                            show: false
                        },
                        nodeStyle : {
                            r: 30
                        },
                        linkStyle : {}
                    }
                },
                linkSymbol: 'arrow',
                minRadius : 15,
                maxRadius : 25,
                density : 0.05,
                attractiveness: 0.8
            }
        ]
    };

    function messageCallback( data ) {
        if ( data === false ) {
            notice( 'This page not use AMD.' );
            return;
        }

        var info = parseConfigAndEntries( esprima.parse( data ) );

        amd.initConfigIndex( info.config );
        var ul = document.createElement( 'ul' );
        ul.className = 'entries';
        for ( var id in info.entries ) {
            var li = document.createElement( 'li' );
            li.innerHTML = id;
            li.setAttribute( 'data-realid', amd.normalize( id ) );
            li.onclick = createAnalyzer( id );
            ul.appendChild( li );
        }
        document.getElementById( 'header' ).appendChild( ul );
        document.getElementById( 'analyse-start' ).onclick = function () {
            analyseModule( document.getElementById( 'analyse-id' ).value );
        };

        chart = require( 'echarts' ).init( document.getElementById( 'chart' ) );
    }

    function analyseModule( id ) {
        analyse( id );
        chart && chart.setOption( getChartOption( id ), !!1 );
    }

    function getChartOption( id ) {
        // return chartOptions;
        var modules = analyse.getModules();

        var visibleModules = {};
        var index = 0;
        var nodes = [];
        var links = [];
        var categories = [];
        var categoriesMap = {};
        var legendData = [];
        var categoryIndex = 0;

        visit( id ).category = 0;
        var sery = chartOptions.series[ 0 ];
        sery.nodes = nodes;
        sery.links = links;
        sery.categories = categories;
        chartOptions.legend = {
            x: 'left',
            data: legendData
        };
        console.log(nodes)
        console.log(links)

        return chartOptions;

        function visit( id ) {
            if ( id in visibleModules ) {
                return visibleModules[ id ];
            }

            var module = modules[ id ];
            var category = id.split( '/' )[ 0 ];

            var categoryObj = categoriesMap[ category ];
            if ( !categoryObj ) {
                categoryObj = {
                    name: category,
                    index: categoryIndex++
                };
                categoriesMap[ category ] = categoryObj;
                categories.push( categoryObj );
                legendData.push( category );
            }

            var visibleModule = 0;
            if ( module ) {
                visibleModule = {
                    name: id,
                    index: index++,
                    value: 3,
                    category: categoryObj.index
                };
                visibleModules[ id ] = visibleModule;
                nodes.push( visibleModule );

                module.realDependencies.forEach( function ( dependency ) {
                    var dependencyNode = visit( dependency.id );
                    links.push( {
                        source: visibleModule.index,
                        target: dependencyNode.index,
                        weight: 3,
                        itemStyle: {normal: {strokeColor: dependency.hard ? '#5182ab' : '#ddd'}}
                    } );
                } );
            }
            else {
                visibleModules[ id ] = visibleModule;
            }

            return visibleModule;
        }
    }

    function createAnalyzer( id ) {
        return function () {
            document.getElementById( 'analyse-id' ).value = id;
            analyseModule( id );
        };
    }

    var SYNTAX = estraverse.Syntax;

    function parseConfigAndEntries( ast ) {
        var result = {
            entries: {},
            config: {
                baseUrl: './'
            }
        };

        estraverse.traverse( ast, {
            enter: function ( node ) {
                if ( node.type != SYNTAX.CallExpression ) {
                    return;
                }

                var nodeCallee = node.callee;
                var asyncReqs;

                if (
                    nodeCallee.type == SYNTAX.MemberExpression
                    && nodeCallee.object && nodeCallee.object.name == 'require'
                    && nodeCallee.property && nodeCallee.property.name == 'config'
                ) {
                    asyncReqs = node.arguments[0];
                    if ( asyncReqs ) {
                        var conf = require( './ast2obj' )( asyncReqs );
                        for ( var key in conf ) {
                            var confItem = conf[ key ];
                            switch( typeof confItem ) {
                                case 'string':
                                    result.config[ key ] = confItem;
                                    break;
                                case 'object':
                                    if ( confItem instanceof Array ) {
                                        !result.config[ key ] && (result.config[ key ] = []);
                                        confItem.forEach( function ( confItemItem ) {
                                            result.config[ key ].push( confItemItem );
                                        } );
                                    }
                                    else {
                                        !result.config[ key ] && (result.config[ key ] = {});
                                        require( './extend' )( result.config[ key ], confItem );
                                    }
                            }
                        }
                    }
                }
                else if (
                    nodeCallee.name == 'require'
                    && (asyncReqs = node.arguments instanceof Array && node.arguments[0])
                    && asyncReqs.type == SYNTAX.ArrayExpression
                ) {
                    asyncReqs.elements.forEach( function ( arg ) {
                        if ( arg.type == 'Literal' && typeof arg.value == 'string' ) {
                            result.entries[ arg.value ] = 1;
                        }
                    } );
                }
            }
        } );

        return result;
    }

    return {
        init: init
    };
});
