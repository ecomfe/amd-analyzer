require.config({
    baseUrl: './src',
    paths: {
        echarts: '../echarts'
    },
    waitSeconds: 3
});

require( [ 'echarts' ], function () {
    require( [ 'main' ], function ( main ) {
        main.init();
    } );
} );

