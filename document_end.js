chrome.runtime.onMessage.addListener(
    function ( request, sender, sendResponse ) {
        // var def = document.contentWindow.define;
        // if ( def && def.amd ) {
            var source = getInlineScript();
            sendResponse( source );
        // }
        // else {
        //     sendResponse( false );
        // }
    }
);

function getInlineScript() {
    var scriptSources = [];
    var scripts = document.getElementsByTagName( 'script' );
    for ( var i = 0; i < scripts.length; i++ ) {
        var script = scripts[ i ];
        if ( !script.src ) {
            scriptSources.push( script.text );
        }
    }

    return scriptSources.join( ';\n' );
}

