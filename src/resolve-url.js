define( function () {
    return function resolveUrl( url, base ) {
        if ( /^([a-z]{2,8}:\/)?\//i.test( url ) ) {
            return url;
        }

        base = base.split( '/' );
        base.length = base.length - 1;
        url = url.split( '/' );
        for ( var i = 0; i < url.length; i++ ) {
            switch ( url[ i ] ) {
                case '.':
                    break;
                case '..':
                    base.length = base.length - 1;
                    break;
                default:
                    base.push( url[ i ] );
            }
        }

        return base.join( '/' );
    };
});
