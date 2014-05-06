define( function ( require ) {
    var SYNTAX = estraverse.Syntax;

    function parseRawObject( ast ) {

        function parseObject( node ) {
            var value = {};
            node.properties.forEach( function ( prop ) {
                value[ prop.key.name || prop.key.value ] = parse( prop.value );
            });

            return value;
        }

        function parseArray( node ) {
            var value = [];
            node.elements.forEach( function ( element ) {
                value.push( parse( element ) );
            });

            return value;
        }

        function parseLiteral( node ) {
            return node.value;
        }

        function parse( node ) {
            switch (node.type) {
                case SYNTAX.ObjectExpression:
                    return parseObject( node );
                case SYNTAX.Literal:
                    return parseLiteral( node );
                case SYNTAX.ArrayExpression:
                    return parseArray( node );
                default:
                    throw new Error( '[RAWOBJECT_FAIL]' );
            }
        }

        return parse( ast );
    }

    return parseRawObject;
} );
