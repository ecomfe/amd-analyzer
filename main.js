require.config({
    baseUrl: './src',
    paths: {
        echarts: '../echarts'
    }
});

require( [ 'echarts' ], function () {
    require( [ 'main' ], function ( main ) {
        main.init();
    } );
} );

