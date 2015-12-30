/**
 * @file echarts画出依赖图
 * @author mj(zoumiaojiang@gmail.com)
 */

define(function (require) {

    var analyse = require('./parser/analyse');
    var echarts = require('echarts');
    var log = require('common/log');


    /**
     * 图表组件对象
     *
     * @inner
     * @type {Object}
     */
    var chart = echarts.init(document.getElementById('charts'));


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
                                color: '#333', // '#bb0e14',
                                fontStyle: 'italic',
                                fontFamily: 'consolas'
                            }
                        },
                        nodeStyle : {
                            brushType: 'fill',
                            strokeColor: 'rgba(255,215,0,0.4)',
                            lineWidth: 0
                        }
                    },
                    emphasis: {
                        label: {show: false},
                        nodeStyle: {},
                        linkStyle: {}
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
    function getOption(id) {

        var modules = analyse.getModules();
        var visibleModules = {};
        var index = 0;
        var nodes = [];
        var links = [];
        var categories = [];
        var categoriesMap = {};
        var legendData = [];
        var categoryIndex = 0;
        var entryNode = visit(id);
        entryNode.value = 20;
        entryNode.category = 0;
        entryNode.itemStyle = {
            normal: {
                brushType : 'both',
                strokeColor : '#f24a71',
                color : '#f24a71',
                lineWidth : 10
            }
        };

        var sery = option.series[0];
        sery.nodes = nodes;
        sery.links = links;
        sery.categories = categories;

        var selectedData = {};
        legendData.forEach(function (item, index) {
            if (index > 2) {
                selectedData[item] = false;
            }
        });

        option.legend = {
            x: 'right',
            data: legendData,
            selected: selectedData,
            orient: 'vertical',
            textStyle: {
                color: '#21cbff',
                fontFamily: 'consolas',
                fontStyle: 'italic'
            }
        };

        return option;


        /**
         * 遍历模块依赖
         *
         * @param  {string} id 模块id
         * @return {Object}    模块map
         */
        function visit(id) {
            if (id in visibleModules) {
                return visibleModules[id];
            }

            var module = modules[id];
            var category = id.split('/')[0];
            var categoryObj = categoriesMap[category];

            if (!categoryObj) {
                categoryObj = {
                    name: category,
                    index: categoryIndex++
                };
                categoriesMap[category] = categoryObj;
                categories.push(categoryObj);
                legendData.push(category);
            }

            var visibleModule = 0;
            if (module) {
                visibleModule = {
                    name: id,
                    index: index++,
                    value: 3,
                    category: categoryObj.index
                };
                visibleModules[id] = visibleModule;
                nodes.push(visibleModule);

                module.realDependencies.forEach(function (dependency) {
                    if (!(dependency.id in modules)) {
                        log.error(module.id + '模块中的' + dependency.id + '模块没找到');
                    }
                    else {
                        var dependencyNode = visit(dependency.id);
                        links.push({
                            source: visibleModule.index,
                            target: dependencyNode.index,
                            weight: 3,
                            itemStyle: {
                                normal: {
                                    strokeColor: dependency.hard ? '#00c7d3' : '#ccc'
                                }
                            }
                        });
                    }
                });
            }
            else {
                visibleModules[id] = visibleModule;
            }

            return visibleModule;
        }
    }



    /**
     * 显示模块依赖的图表信息
     *
     * @param {string} id 模块id
     */
    function displayChart(id) {
        chart && chart.setOption(getOption(id), !!1);
    }

    return displayChart;

});
