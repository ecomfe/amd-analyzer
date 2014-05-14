chrome.runtime.onMessage.addListener(
    function ( request, sender, sendResponse ) {
        // var def = document.contentWindow.define;
        // if ( def && def.amd ) {
            sendResponse( getScripts() );
        // }
        // else {
        //     sendResponse( false );
        // }
    }
);

function getScripts() {
    var result = [];
    var scripts = document.getElementsByTagName( 'script' );
    for ( var i = 0; i < scripts.length; i++ ) {
        var script = scripts[ i ];
        if ( script.src ) {
            !script.async && result.push( {type: 'external', src: script.src} );
        }
        else {
            result.push( {type: 'internal', text: script.text} );
        }
    }

    return result;
}

