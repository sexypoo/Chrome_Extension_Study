// content.js  ────────────────────────────────────────────
// 방문 페이지 내부에 주입되어 메트릭(HTTPS, 단어 수, 링크 비율 등)을 수집하고
// popup → REQUEST_METRICS 메시지에 응답한다.
// ────────────────────────────────────────────────────────
(() => {
  /**
   * 간단 메트릭 수집 함수
   * @returns {Object} { https, titleLength, wordCount, externalRatio }
   */
  function collectMetrics() {
    // HTTPS 사용 여부
    const https = location.protocol === 'https:';

    // 제목 길이
    const titleLength = (document.title || '').trim().length;

    // 본문 단어 수
    const text = (document.body?.innerText || '').trim();
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    // 외부 링크 비율
    const links = Array.from(document.querySelectorAll('a[href]'));
    const externalLinks = links.filter((a) => {
      try { return new URL(a.href).origin !== location.origin; }
      catch { return false; }
    });
    const externalRatio = links.length
      ? externalLinks.length / links.length
      : 0;

    return { https, titleLength, wordCount, externalRatio };
  }

  // popup.js 로부터 메시지를 수신하면 메트릭을 응답
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'REQUEST_METRICS') {
      sendResponse(collectMetrics());
      return true;  // async 응답 가능 플래그
    }
  });
})();
