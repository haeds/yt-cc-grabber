const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)';
const RE_XML_TRANSCRIPT = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;

async function getSubtitles(language, type) {
  const videoId = getVideoId();
  if (!videoId) {
    throw new Error('Не удалось получить ID видео');
  }

  const videoPageBody = await fetchVideoPage(videoId);
  const captionsData = extractCaptionsData(videoPageBody);
  
  if (!captionsData) {
    throw new Error('Субтитры недоступны для этого видео');
  }

  const { transcriptURL, languageCode, kind } = getTranscriptURL(captionsData, language, type);
  const transcriptBody = await fetchTranscript(transcriptURL);
  const subtitles = parseTranscript(transcriptBody);
  return { subtitles, languageCode, kind };
}

function getVideoId() {
  const url = window.location.href;
  const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/);
  return match ? match[1] : null;
}

async function fetchVideoPage(videoId) {
  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { 'User-Agent': USER_AGENT }
  });
  return await response.text();
}

function extractCaptionsData(videoPageBody) {
  const splittedHTML = videoPageBody.split('"captions":');
  if (splittedHTML.length <= 1) return null;

  try {
    return JSON.parse(splittedHTML[1].split(',"videoDetails')[0].replace('\n', ''))?.playerCaptionsTracklistRenderer;
  } catch (e) {
    return null;
  }
}

function getTranscriptURL(captionsData, preferredLanguage, preferredType) {
  const languagePriority = preferredLanguage === 'ru' ? ['ru', 'en-GB', 'en-US', 'en'] : ['en-GB', 'en-US', 'en', 'ru'];
  let selectedTrack;

  // Сначала ищем субтитры выбранного типа на предпочтительном языке
  for (const lang of languagePriority) {
    selectedTrack = captionsData.captionTracks.find(track => 
      track.languageCode.startsWith(lang) && 
      (preferredType === 'auto' ? track.kind === 'asr' : track.kind !== 'asr')
    );
    if (selectedTrack) break;
  }

  // Если не нашли, ищем любые субтитры на предпочтительном языке
  if (!selectedTrack) {
    for (const lang of languagePriority) {
      selectedTrack = captionsData.captionTracks.find(track => 
        track.languageCode.startsWith(lang)
      );
      if (selectedTrack) break;
    }
  }

  if (!selectedTrack) {
    throw new Error('Подходящие субтитры не найдены');
  }

  return { transcriptURL: selectedTrack.baseUrl, languageCode: selectedTrack.languageCode, kind: selectedTrack.kind };
}

async function fetchTranscript(transcriptURL) {
  const response = await fetch(transcriptURL, {
    headers: { 'User-Agent': USER_AGENT }
  });
  return await response.text();
}

function parseTranscript(transcriptBody) {
  const results = [...transcriptBody.matchAll(RE_XML_TRANSCRIPT)];
  return results.map(result => result[3] + '. ').join('').trim();
}

function formatTime(seconds) {
  const date = new Date(seconds * 1000);
  const hh = date.getUTCHours().toString().padStart(2, '0');
  const mm = date.getUTCMinutes().toString().padStart(2, '0');
  const ss = date.getUTCSeconds().toString().padStart(2, '0');
  const ms = date.getUTCMilliseconds().toString().padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

function copyToClipboard(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

async function handleGetAndCopySubtitles(language, type) {
  try {
    const videoId = getVideoId();
    if (!videoId) {
      throw new Error('Не удалось получить ID видео');
    }

    const videoPageBody = await fetchVideoPage(videoId);
    const captionsData = extractCaptionsData(videoPageBody);
    
    if (!captionsData) {
      throw new Error('Субтитры недоступны для этого видео');
    }

    const availableSubtitles = getAvailableSubtitles(captionsData);

    const result = await getSubtitles(language, type, captionsData);
    copyToClipboard(result.subtitles);
    const subtitleType = result.kind === 'asr' ? 'автоматически сгенерированные' : 'ручные';
    return { 
      success: true, 
      message: `Субтитры (${result.languageCode}, ${subtitleType}) скопированы в буфер обмена`,
      availableSubtitles: availableSubtitles
    };
  } catch (error) {
    return { error: error.message };
  }
}

// Обновленный обработчик сообщений
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getAndCopySubtitles") {
    handleGetAndCopySubtitles(request.language, request.type).then(sendResponse);
    return true; // Indicates that the response is asynchronous
  }
});

function getAvailableSubtitles(captionsData) {
  return captionsData.captionTracks.map(track => ({
    languageCode: track.languageCode,
    label: track.name.simpleText,
    kind: track.kind
  }));
}