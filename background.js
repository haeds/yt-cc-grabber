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
      
      if (!response) {
        logMessage("Ошибка: Не получен ответ от страницы");
        return;
      }

      if (response.error) {
        logMessage(`Ошибка: ${response.error}`);
      } else if (response.success) {
        logMessage(response.message);
      } else {
        logMessage("Ошибка: Неожиданный ответ от страницы");
      }
    });
  } else {
    logMessage("Это расширение работает только на страницах YouTube с видео");
  }
});