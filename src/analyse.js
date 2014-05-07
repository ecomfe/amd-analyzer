/**
 * @file 分析模块
 * @author errorrik(errorrik@gmail.com)
 */

define( function ( require ) {

    var BUILTIN_MODULES = {require: 1, module: 1, exports: 1};
    var SYNTAX = estraverse.Syntax;
    var amd = require( './amd' );
    var getText = require( './get-text' );
    var ast2obj = require( './ast2obj' );

    var modules = {};

    /**
     * 分析模块
     *
     * @param {string} id 模块id
     */
    function analyseModule( id ) {
        var moduleId = amd.parseId( id ).module;
        if ( modules[ moduleId ] ) {
            return;
        }

        var SYNTAX = estraverse.Syntax;

        try {
            var source = getText( amd.getModuleUrl( moduleId ) );
            estraverse.traverse( esprima.parse( source ), {
                enter: function ( node ) {
                    if ( node.type == SYNTAX.CallExpression && node.callee.name == 'define' ) {
                        this.skip();

                        var args = node.arguments;
                        var argsLen = args.length;
                        var factory = args[ --argsLen ];
                        var dependencies = ['require', 'exports', 'module'];
                        var id = moduleId;
                        while ( argsLen-- ) {
                            var arg = args[ argsLen ];
                            if ( arg.type == SYNTAX.ArrayExpression ) {
                                dependencies = ast2obj( arg );
                            }
                            else if ( arg.type == SYNTAX.Literal && typeof arg.value == 'string' ) {
                                id = arg.value;
                            }
                        }

                        var functionLevel = -1;
                        var factoryArgLen = factory.type == SYNTAX.FunctionExpression
                            ? factory.params.length
                            : 0;

                        var realDependencies = [];
                        var realDependenciesMap = [];
                        function addRealDependency( dep ) {
                            if ( !realDependenciesMap[ dep.id ] ) {
                                realDependencies.push( dep );
                                realDependenciesMap[ dep.id ] = 1;
                            }
                        }

                        dependencies.forEach( function ( dependency, index ) {
                            if ( !BUILTIN_MODULES[ dependency ] ) {
                                addRealDependency( {
                                    id: amd.normalize( amd.parseId( dependency ).module, id ),
                                    hard: index < factoryArgLen
                                } );
                            }
                        } );

                        if ( factory.type == SYNTAX.FunctionExpression ) {
                            estraverse.traverse( factory, {
                                enter: function ( node ) {
                                    var requireArg0;

                                    switch ( node.type ) {
                                        case SYNTAX.FunctionExpression:
                                        case SYNTAX.FunctionDeclaration:
                                            functionLevel++;
                                            break;
                                        case SYNTAX.CallExpression:
                                            if ( node.callee.name == 'require'
                                                && (requireArg0 = node.arguments[0])
                                                && requireArg0.type == SYNTAX.Literal
                                                && typeof requireArg0.value == 'string'
                                            ) {
                                                addRealDependency( {
                                                    id: amd.normalize( amd.parseId( requireArg0.value ).module, id ),
                                                    hard: functionLevel <= 0
                                                } );
                                            }
                                            break;
                                    }
                                },

                                leave: function ( node ) {
                                    switch ( node.type ) {
                                        case SYNTAX.FunctionExpression:
                                        case SYNTAX.FunctionDeclaration:
                                            functionLevel--;
                                            break;
                                    }
                                }
                            } );
                        }

                        modules[ id ] = {
                            id: id,
                            dependencies: dependencies,
                            realDependencies: realDependencies
                        };

                        realDependencies.forEach( function ( dependency ) {
                            analyseModule( dependency.id );
                        } );
                    }
                }
            } );
        }
        catch ( ex ){}
    }

    /**
     * 获取分析过的所有模块结果
     * 返回所有模块结果是不对的，但插件复杂度比较低，就先这样了
     *
     * @return {Object}
     */
    analyseModule.getModules = function () {
        return modules;
    };

    return analyseModule;
} );
