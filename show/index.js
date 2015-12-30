/**
 * @file 分析页面入口
 * @author mj(zoumiaojiang@gmail.com)
 */

require.config({
    baseUrl: './src',
    paths: {
        echarts: './common/echarts'
    },
    waitSeconds: 3
});

require(['echarts'], function () {
    require(['main'], function (main) {
        main.start();
    });
});

