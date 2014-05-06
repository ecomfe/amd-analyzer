chrome.browserAction.onClicked.addListener(
    function ( tab ) {
        var url = chrome.extension.getURL( 'main.html#' + tab.id );
        chrome.tabs.create( {url: url} );
    }
);
