define( function () {
    return function ( url ) {
        var xhr = new XMLHttpRequest();
        xhr.open( 'GET', url, false );
        xhr.send();

        if ( xhr.status >= 200 && xhr.status < 300 ) {
            return xhr.responseText;
        }

        throw new Error('[GETTEXT_FAIL]');
    };
} );
