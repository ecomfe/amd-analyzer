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
     * define分析
     *
     * @inner
     * @param {Object} node define的语法树节点
     */
    function analyseDefineNode( node, moduleId ) {
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
            else if ( arg.type == SYNTAX.Literal
                && typeof arg.value == 'string'
            ) {
                id = arg.value;
            }
        }

        if ( !id ) {
            return;
        }

        var functionLevel = -1;
        var factoryArgLen = factory.type == SYNTAX.FunctionExpression
            ? factory.params.length
            : 0;

        var realDependencies = [];
        var realDependenciesMap = [];
        function addRealDependency( dep ) {
            var depObj = realDependenciesMap[ dep.id ];
            if ( !depObj ) {
                realDependencies.push( dep );
                realDependenciesMap[ dep.id ] = dep;
            }
            else {
                depObj.hard = depObj.hard || dep.hard;
            }
        }

        dependencies.forEach( function ( dep, index ) {
            var dependencyId = amd.normalize( amd.parseId( dep ).module, id );
            if ( !BUILTIN_MODULES[ dependencyId ] ) {
                addRealDependency( {
                    id: dependencyId,
                    hard: index < factoryArgLen
                } );
            }
        } );

        if ( factory.type == SYNTAX.FunctionExpression ) {
            var requireFormalParameter;
            dependencies.forEach( function ( dep, index ) {
                if ( index >= factory.params.length ) {
                    return false;
                }

                if ( dep === 'require' ) {
                    requireFormalParameter = factory.params[ index ].name;
                    return false;
                }
            });

            estraverse.traverse( factory, {
                enter: function ( node ) {
                    var requireArg0;

                    switch ( node.type ) {
                        case SYNTAX.FunctionExpression:
                        case SYNTAX.FunctionDeclaration:
                            functionLevel++;
                            break;
                        case SYNTAX.CallExpression:
                            if ( requireFormalParameter
                                && node.callee.name == requireFormalParameter
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
    /**
     *
     *
     * 通过ast分析模块
     *
     * @inner
     * @param {Object} ast
     */
    function analyseByAst( ast, moduleId ) {
        try {
            estraverse.traverse( ast, {
                enter: function ( node ) {
                    if ( node.type != SYNTAX.CallExpression
                        || node.callee.name != 'define'
                    ) {
                        return;
                    }

                    this.skip();
                    analyseDefineNode( node, moduleId );
                }
            } );
        }
        catch ( ex ){}
    }

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

        var source = getText( amd.getModuleUrl( moduleId ) );
        analyseByAst( esprima.parse( source ), moduleId );
    }

    function analyse( id ) {
        analyseModule( id );
    }

    /**
     * 获取分析过的所有模块结果
     * 返回所有模块结果是不对的，但插件复杂度比较低，就先这样了
     *
     * @return {Object}
     */
    analyse.getModules = function () {
        return modules;
    };

    /**
     * 通过ast分析模块
     *
     * @param {Object} ast
     */
    analyse.byAst = analyseDefineNode;

    return analyse;
} );
