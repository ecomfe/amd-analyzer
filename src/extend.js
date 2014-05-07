/**
 * @file 扩展对象属性
 * @author errorrik(errorrik@gmail.com)
 */

define( function () {
    return function ( target, source ) {
        for ( var key in source ) {
            if ( source.hasOwnProperty( key ) ) {
                target[ key ] = source[ key ];
            }
        }
    };
} )
