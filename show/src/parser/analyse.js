/**
 * @file modules pool
 * @author mj(zoumiaojiang@gmail.com)
 */

define(function (require) {

    var BUILTIN_MODULES = {require: 1, module: 1, exports: 1};
    var SYNTAX = estraverse.Syntax;

    var amd = require('./amd');
    var ast2obj = require('./ast2obj');
    var log = require('../common/log');

    var gcodeMap;

    /**
     * 模块池子
     *
     * @type {Object}
     */
    var modules = {};

    var analyse = {};


    /**
     * 放一个modules到池子里去
     *
     * @param {string} id  模块id
     * @param {Object} obj 模块的依赖info
     */
    analyse.set = function (id, obj) {
        modules[id] = obj;
    };


    /**
     * 获取模块信息
     *
     * @param  {string} id 模块id,可选项,如果不传则代表获取所有的池子中的模块
     * @return {Object}    从池子中捞出来的内容
     */
    analyse.getModules = function (id) {
        return id ? modules[id] : modules;
    };


    /**
     * 分析define函数模块
     *
     * @param  {Object} node     define函数节点
     * @param  {string} filepath 模块所在的文件路径
     */
    analyse.analyseDefineNode = function (node, filepath) {

        var args = node.arguments;
        var argsLen = args.length;
        var factory = args[--argsLen];
        var dependencies = ['require', 'exports', 'module'];
        var id;

        while (argsLen--) {
            var arg = args[argsLen];
            if (arg.type == SYNTAX.ArrayExpression) {
                dependencies = ast2obj(arg);
            }
            else if (arg.type == SYNTAX.Literal && typeof arg.value == 'string') {
                id = arg.value;
            }
        }

        // 单个文件为一个模块的情况下并且没有指定具名模块id
        id = id || gcodeMap[filepath].id;

        if (factory.id) {
            log.warm(id + '模块factory为具名函数');
        }

        if (!id) {
            return;
        }

        var functionLevel = -1;
        var factoryArgLen = factory.type == SYNTAX.FunctionExpression ? factory.params.length : 0;
        var realDependencies = [];
        var realDependenciesMap = {};

        function addRealDependency(dep) {
            var depObj = realDependenciesMap[dep.id];
            if (!depObj) {
                realDependencies.push(dep);
                realDependenciesMap[dep.id] = dep;
            }
            else {
                depObj.hard = depObj.hard || dep.hard;
            }
        }
        dependencies.forEach(function (dep, index) {
            var dependencyId = amd.normalize(amd.parseId(dep).module, id);
            if (!BUILTIN_MODULES[dependencyId]) {
                addRealDependency({
                    id: dependencyId,
                    hard: index < factoryArgLen
                });
            }
        });

        if (factory.type == SYNTAX.FunctionExpression) {
            var requireFormalParameter;

            // 这里对模块内部的require回调做处理
            estraverse.traverse(factory, {
                enter: function (node) {
                    if (node.type !== SYNTAX.CallExpression
                        || node.callee.name !== 'require'
                        || node.arguments[0].type !== SYNTAX.ArrayExpression
                    ) {
                        return;
                    }
                    this.skip();
                    node.arguments[0].elements.forEach(function (dep) {
                        if (dep.type == SYNTAX.Literal && typeof dep.value === 'string') {
                            dependencies.push(dep.value);
                            addRealDependency({
                                id: amd.normalize(amd.parseId(dep.value).module, id),
                                hard: 1
                            });
                        }
                    });
                }
            });

            dependencies.forEach(function (dep, index) {
                if (index >= factory.params.length) {
                    return false;
                }
                if (dep === 'require') {
                    requireFormalParameter = factory.params[index].name;
                    return false;
                }
            });

            estraverse.traverse(factory, {
                enter: function (node) {
                    var requireArg0;

                    switch (node.type) {
                        case SYNTAX.FunctionExpression:
                        case SYNTAX.FunctionDeclaration:
                            functionLevel++;
                            break;

                        case SYNTAX.CallExpression:
                            if (requireFormalParameter
                                && node.callee.name == requireFormalParameter
                                && (requireArg0 = node.arguments[0])
                                && requireArg0.type == SYNTAX.Literal
                                && typeof requireArg0.value == 'string'
                            ) {
                                addRealDependency({
                                    id: amd.normalize(amd.parseId(requireArg0.value).module, id),
                                    hard: functionLevel <= 0
                                });
                            }
                            break;
                    }
                },

                leave: function (node) {
                    switch (node.type) {
                        case SYNTAX.FunctionExpression:
                        case SYNTAX.FunctionDeclaration:
                            functionLevel--;
                            break;
                    }
                }
            });

            if (!factory.params || factory.params.length == 0) {
                log.warm(id
                    + ' 模块factory无require参数，使用全局require可能会导致错误。'
                    + (filepath ? '<a target="_blank" href="' + filepath + '">file</a>' : '[inline]')
                );
            }
        }

        analyse.set(id, {
            id: id,
            dependencies: dependencies,
            realDependencies: realDependencies
        });

        log.info(id
            + ' 模块分析完成 '
            + (filepath ? '<a target="_blank" href="' + filepath + '">file</a>' : '[inline]')
        );
    };


    /**
     * 解析一段js代码(文件为单位)
     *
     * @param  {string} code     js代码片段
     * @param  {string} filepath js代码所处的文件路径
     */
    function parseCode(code, filepath) {
        try {
            var ast = esprima.parse(code.code);
            estraverse.traverse(ast, {
                enter: function (node) {
                    if (node.type === SYNTAX.CallExpression && node.callee.name === 'define') {
                        analyse.analyseDefineNode(node, filepath);
                    }
                }
            });
        }
        catch (ex) {
            log.error(filepath + '文件有语法错误');
            log.error(ex);
        }
    }


    /**
     * 解析codeMap
     *
     * @param  {Object} codeMap js codeMap
     */
    analyse.parse = function (codeMap) {
        gcodeMap = codeMap;
        for (var filepath in codeMap) {
            if (codeMap.hasOwnProperty(filepath)) {
                parseCode(codeMap[filepath], filepath);
            }
        }
    };

    return analyse;
});
