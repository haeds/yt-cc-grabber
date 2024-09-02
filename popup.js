document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('copySubtitles').addEventListener('click', function() {
    const language = document.getElementById('language').value;
    const type = document.getElementById('type').value;

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "getAndCopySubtitles",
        language: language,
        type: type
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          alert("An error occurred while executing the script");
        } else if (response && response.error) {
          alert(`Error: ${response.error}`);
        } else if (response && response.success) {
          alert(response.message);
        } else {
          alert("Unexpected response from the page");
        }
      });
    });
  });
});