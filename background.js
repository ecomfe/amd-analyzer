/**
 * @file amd doctor background.js
 * @author mj(zoumiaojiang@gmail.com)
 */

(function (root) {

    // When the extension is installed or upgraded ...
    chrome.runtime.onInstalled.addListener(function () {

        // 长链接监听content_script那边动作
        chrome.extension.onConnect.addListener(function (port) {

            // 监听到了
            port.onMessage.addListener(function (msg) {

                // 如果是要跳转到展示页面的话
                if (msg.actionName === 'tobackgroundpage') {
                    chrome.tabs.getSelected(function (tab) {
                        chrome.pageAction.show(tab.id);
                    });
                }
            });
        });

        // 监听page action的icon点击事件
        chrome.pageAction.onClicked.addListener(function (tab) {
            chrome.tabs.create({
                url: chrome.extension.getURL('show/index.html#' + tab.id),
                index: tab.index + 1
            });
        });
    });

})(this);
