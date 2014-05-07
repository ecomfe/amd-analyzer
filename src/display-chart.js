/**
 * @file 显示模块依赖的图表信息
 * @author errorrik(errorrik@gmail.com)
 */

define( function ( require ) {
    var analyse = require( './analyse' );

    /**
     * 图表组件对象
     *
     * @inner
     * @type {Object}
     */
    var chart = require( 'echarts' ).init( document.getElementById( 'chart' ) );

    /**
     * 图表默认参数
     *
     * @inner
     * @type {Object}
     */
    var option = {
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

    /**
     * 获取模块的图标依赖参数和数据
     *
     * @inner
     * @param {string} id 模块id
     * @return {Object}
     */
    function getOption( id ) {
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
        var sery = option.series[ 0 ];
        sery.nodes = nodes;
        sery.links = links;
        sery.categories = categories;
        option.legend = {
            x: 'left',
            data: legendData
        };

        return option;

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

    /**
     * 显示模块依赖的图表信息
     *
     * @param {string} id 模块id
     */
    function displayChart( id ) {
        chart && chart.setOption( getOption( id ), !!1 );
    }

    return displayChart;
} );
