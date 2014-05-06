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
                        label: { show: false },
                        nodeStyle : {  },
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

        var ul = document.querySelector( '#header ul' );
        for ( var id in info.entries ) {
            var b = document.createElement( 'li' );
            b.innerHTML = id;
            b.setAttribute( 'data-realid', amd.normalize( id ) );
            b.onclick = createAnalyzer( id );
            ul.appendChild( b );
        }

        document.getElementById( 'analyse-start' ).onclick = function () {
            analyseModule( document.getElementById( 'analyse-id' ).value );
        };

        chart = require( 'echarts' ).init( document.getElementById( 'chart' ) );
    }

    function analyseModule( id ) {
        analyse( id );
        showModuleInfo( id );
        chart && chart.setOption( getChartOption( id ), !!1 );
    }

    function showModuleInfo( id ) {

        var modules = analyse.getModules();
        var dependencies = [];
        var dependenciesMap = {};

        var visitStack = [ id ];
        var hardStack = [ 1 ];
        var visited = {};
        var pointer = 0;
        visited[ id ] = 1;
        modules[ id ].realDependencies.forEach( function ( dependency ) {
            visit( dependency );
        } );

        var html = '';
        dependencies.forEach( function ( dependency ) {
            html += '<li'
                + (dependency.direct ? ' data-direct="true"' : '')
                + (dependency.circular ? ' data-circular="true"' : '')
                + (dependency.hard ? ' data-hard="true"' : '')
                + '>'
                + '<b>' + dependency.id + '</b>'
                + '<span class="dep-direct">直接依赖</span>'
                + '<span class="dep-hard">装载时依赖</span>'
                + '<span class="dep-circular">循环依赖</span>'
                + '</li>'
        });
        document.getElementById( 'info' ).innerHTML = html;

        function visit( dependency ) {
            var id = dependency.id;
            if ( visited[ id ] ) {
                var start = pointer;
                while ( start-- ) {
                    if ( visitStack[ start ] == id ) {
                        break;
                    }
                }

                if ( start >= 0 ) {
                    for ( ; start < pointer; start++ ) {
                        start > 0 && (dependenciesMap[ visitStack[ start ] ].circular = 1);
                    }
                }
            }
            else {
                var depObj = {
                    id: dependency.id,
                    hard: hardStack[ pointer ] && dependency.hard,
                    direct: !pointer
                };
                dependencies.push( depObj );
                dependenciesMap[ id ] = depObj;

                visitStack.push( id );
                hardStack.push( depObj.hard );
                visited[ id ] = 1;
                pointer++;

                var depModule = modules[ id ];
                if ( depModule ) {
                    depModule.realDependencies.forEach( function ( dependency ) {
                        visit( dependency );
                    } );
                }

                visitStack.pop();
                hardStack.pop();
                pointer--;
            }
        }
    }

    function getChartOption( id ) {
        var modules = analyse.getModules();

        var visibleModules = {};
        var index = 0;
        var nodes = [];
        var links = [];
        var categories = [];
        var categoriesMap = {};
        var legendData = [];
        var categoryIndex = 0;

        var entryNode = visit( id );
        entryNode.value = 20;
        entryNode.category = 0;
        entryNode.itemStyle = { normal: {
            brushType : 'both',
            strokeColor : 'red',
            color : 'red',
            lineWidth : 10
        }};
        var sery = chartOptions.series[ 0 ];
        sery.nodes = nodes;
        sery.links = links;
        sery.categories = categories;
        chartOptions.legend = {
            x: 'left',
            data: legendData
        };

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
                        itemStyle: {normal: {
                            strokeColor: dependency.hard ? '#5182ab' : '#ccc'
                        } }
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
