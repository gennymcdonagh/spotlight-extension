chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.browserAction.setIcon({path: "icon-on.png", tabId:tab.id});
  chrome.tabs.executeScript(tab.id, {file:"script.js"});
});