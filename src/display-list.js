/**
 * @file 显示模块的依赖列表信息
 * @author errorrik(errorrik@gmail.com)
 */

define( function ( require ) {
    var analyse = require( './analyse' );

    /**
     * 显示模块的依赖列表信息
     *
     * @param {string} id 模块id
     */
    function displayList( id ) {

        var modules = analyse.getModules();
        var dependencies = [];
        var dependenciesMap = {};

        var visitStack = [ id ];
        var hardStack = [ 1 ];
        var visited = {};
        var pointer = 0;
        visited[ id ] = 1;
        modules[ id ].realDependencies.forEach( function ( dependency ) {
            visit( dependency );
        } );

        var html = '';
        dependencies.forEach( function ( dependency ) {
            html += '<li'
                + (dependency.direct ? ' data-direct="true"' : '')
                + (dependency.circular ? ' data-circular="true"' : '')
                + (dependency.hard ? ' data-hard="true"' : '')
                + '>'
                + '<b>' + dependency.id + '</b>'
                + '<span class="dep-direct">直接依赖</span>'
                + '<span class="dep-hard">装载时依赖</span>'
                + '<span class="dep-circular">循环依赖</span>'
                + '</li>'
        });
        document.getElementById( 'info' ).innerHTML = html;

        function visit( dependency ) {
            var id = dependency.id;
            if ( visited[ id ] ) {
                var start = pointer;
                while ( start-- ) {
                    if ( visitStack[ start ] == id ) {
                        break;
                    }
                }

                if ( start >= 0 ) {
                    for ( ; start <= pointer; start++ ) {
                        start > 0 && (dependenciesMap[ visitStack[ start ] ].circular = 1);
                    }
                }
            }
            else {
                var depObj = {
                    id: dependency.id,
                    hard: hardStack[ pointer ] && dependency.hard,
                    direct: !pointer
                };
                dependencies.push( depObj );
                dependenciesMap[ id ] = depObj;

                visitStack.push( id );
                hardStack.push( depObj.hard );
                visited[ id ] = 1;
                pointer++;

                var depModule = modules[ id ];
                if ( depModule ) {
                    depModule.realDependencies.forEach( function ( dependency ) {
                        visit( dependency );
                    } );
                }

                visitStack.pop();
                hardStack.pop();
                pointer--;
            }
        }
    }

    return displayList;

} );
