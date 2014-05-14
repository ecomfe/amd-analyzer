/**
 * @file 解析页面的inline script
 * @author errorrik(errorrik@gmail.com)
 */

define( function ( require ) {
    var SYNTAX = estraverse.Syntax;

    /**
     * 解析页面的inline script，返回入口模块列表和require配置信息
     *
     * @param {string} source 页面的inline script代码
     * @return {Object} {{Array}entries, {Object}config}
     */
    function parsePageScript( data ) {

        var result = {
            entries: {},
            config: {
                baseUrl: './'
            }
        };

        data.forEach( function ( script ) {
            var source;
            switch ( script.type ) {
                case 'internal':
                    source = script.text;
                    break;
                case 'external':
                    source = require( './get-text' )( script.src );
                    break;
            }

            if ( typeof source === 'string' ) {
                parseScript( source );
            }
        } );

        return result;

        function parseScript( source ) {
            var ast = esprima.parse( source );
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
                    else if ( nodeCallee.name == 'define' ) {
                        this.skip();
                        require( './analyse' ).byAst( node );
                    }
                }
            } );
        }
    };

    return parsePageScript;

} );
