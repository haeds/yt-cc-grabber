function logMessage(message) {
  console.log(message);
}

chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes("youtube.com/watch")) {
    chrome.tabs.sendMessage(tab.id, { action: "getAndCopySubtitles" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        logMessage("Произошла ошибка при выполнении скрипта");
        return;
      }
      
      // Добавляем проверку на undefined
      if (response === undefined) {
        logMessage("Ошибка: Нет ответа от страницы");
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
    logMessage("Это расширение работает только на страницах с видео YouTube");
  }
});