chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage
        ? chrome.runtime.openOptionsPage()
        : window.open(chrome.runtime.getURL('options.html'));
});
