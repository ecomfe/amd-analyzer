/**
 * @file 根据抽象语法树获取对象的值
 * @author errorrik(errorrik@gmail.com)
 *         mj(zoumiaojiang@gmail.com)
 */


define(function (require) {

    var SYNTAX = estraverse.Syntax;


    /**
     * 根据抽象语法树获取对象的值，仅支持Array,Object,Literal(boolean,string,number)
     *
     * 由于chrome extension的沙箱限制，不能eval和new Function
     * 所以不能根据语法树生成source再eval，只好自己写了个这货
     *
     * @param {Object} ast 语法树节点
     * @return {*}
     */
    function getValue(ast) {

        /**
         * 解析对象
         *
         * @inner
         * @param {Object} node 语法树节点
         * @return {Object}
         */
        function parseObject(node) {
            var value = {};
            node.properties.forEach(function (prop) {
                value[prop.key.name || prop.key.value] = parse(prop.value);
            });

            return value;
        }


        /**
         * 解析数组
         *
         * @inner
         * @param {Object} node 语法树节点
         * @return {Array}
         */
        function parseArray(node) {
            var value = [];
            node.elements.forEach(function (element) {
                value.push(parse(element));
            });

            return value;
        }


        /**
         * 解析Literal
         *
         * @inner
         * @param {Object} node 语法树节点
         * @return {*}
         */
        function parseLiteral(node) {
            return node.value;
        }


        /**
         * 解析逻辑运算表达式@by mj
         *
         * @inner
         * @param  {Object} node 语法树节点
         * @return {*}
         */
        function parseLogicExp(node) {
            var op = node.operator;
            var left = (node.left && parse(node.left));
            var right = (node.right && parse(node.right));

            switch (op) {
                case '||':
                    return left || right;
                case '&&':
                    return left && right;
                default:
                    return '';
            }
        }


        /**
         * 解析节点
         *
         * @inner
         * @param {Object} node 语法树节点
         * @return {*}
         */
        function parse(node) {
            switch (node.type) {
                case SYNTAX.ObjectExpression:
                    return parseObject(node);
                case SYNTAX.Literal:
                    return parseLiteral(node);
                case SYNTAX.ArrayExpression:
                    return parseArray(node);
                case SYNTAX.LogicalExpression:
                    return parseLogicExp(node);
                default:
                    // 如果是其他类型就不管了, 忽略掉吧
                    break;
            }
        }

        return parse(ast);
    }

    return getValue;
});
