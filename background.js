function logMessage(message) {
  console.log(message);
}

chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes("youtube.com/watch")) {
    chrome.tabs.sendMessage(tab.id, { action: "getAndCopySubtitles" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        logMessage("An error occurred while executing the script");
        return;
      }
      
      if (!response) {
        logMessage("Error: No response from the page");
        return;
      }

      if (response.error) {
        logMessage(`Error: ${response.error}`);
      } else if (response.success) {
        logMessage(response.message);
      } else {
        logMessage("Error: Unexpected response from the page");
      }
    });
  } else {
    logMessage("This extension only works on YouTube video pages");
  }
});