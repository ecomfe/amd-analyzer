/**
 * @file 解析页面内的inline script (inline script走到这个模块来的都是只和amd相关的js)
 * @author mj(zoumiaojiang@gmail.com)
 */

define(function (require) {

    var SYNTAX = estraverse.Syntax;
    var analyse = require('./analyse');
    var ast2obj = require('./ast2obj');
    var log = require('../common/log');


    /**
     * 解析inline script
     *
     * @param  {string} code inline script code
     * @return {Object}      解析的结果[config信息]
     */
    function parseInlineScript(code, file) {

        // 返回的结果
        var result = {
            status: 0,
            entries: {},
            config: {
                baseUrl: './'
            }
        };

        try {
            var ast = esprima.parse(code);
        }
        catch (ex) {
            log.error('inline script中有语法错误。');
            log.error(ex);
            result.status = 1;
        }

        estraverse.traverse(ast, {
            enter: function (node) {
                if (node.type != SYNTAX.CallExpression) {
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

                    if (asyncReqs) {
                        var conf = ast2obj(asyncReqs);

                        for (var key in conf) {
                            var confItem = conf[key];

                            switch (typeof confItem) {
                                case 'string':
                                    result.config[key] = confItem;
                                    break;
                                case 'object':
                                    if (confItem instanceof Array) {
                                        !result.config[key] && (result.config[key] = []);
                                        confItem.forEach(
                                            function (confItemItem) {
                                                result.config[key].push(confItemItem);
                                            }
                                        );
                                    }
                                    else {
                                        !result.config[key] && (result.config[key] = {});
                                        result.config[key] = $.extend({}, result.config[key], confItem);
                                    }
                                    break;
                            }
                        }
                    }
                }
                else if (
                    nodeCallee.name == 'require'
                    && (asyncReqs = node.arguments instanceof Array && node.arguments[0])
                    && asyncReqs.type == SYNTAX.ArrayExpression
                ) {
                    asyncReqs.elements.forEach(
                        function (arg) {
                            if (arg.type == 'Literal' && typeof arg.value == 'string') {
                                result.entries[arg.value] = 1;
                            }
                        }
                    );
                }
                else if (nodeCallee.name == 'define' && !file) {
                    this.skip();
                    analyse.analyseDefineNode(node);
                }
            }
        });

        return result;
    }

    return parseInlineScript;

});
