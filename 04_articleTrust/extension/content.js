/* =========================================================================
 *  content.js – News Bias Analyzer
 * ========================================================================= */

let lastResult = null;

(async () => {
  const article = new Readability(document.cloneNode(true)).parse();
  if (!article?.textContent || article.textContent.length < 200) return;

  const payload = { content: article.textContent, source: location.hostname };

  const resp = await chrome.runtime.sendMessage(
    { type: "NBA_ANALYZE_ARTICLE", payload }
  );

  console.log("[CS] resp =", resp);        // 값 확인

  if (!resp?.ok) { console.warn("[NBA] 분석 실패:", resp?.error); return; }

  lastResult = resp.data;
  renderOverlay(resp.data);
})();

/* GET_LAST_RESULT 리스너와 renderOverlay 함수는 그대로 */