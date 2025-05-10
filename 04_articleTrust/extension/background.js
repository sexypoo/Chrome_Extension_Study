/* =========================================================================
 *  background.js – News Bias Analyzer  (MV3 service-worker)
 * ========================================================================= */

chrome.runtime.onMessage.addListener((msg, sender, _) => {

  /* STEP‑1‑A: 우리 타입만 받기 */
  if (!msg || msg.type !== "NBA_ANALYZE_ARTICLE") return;

  console.log("[SW] STEP‑1‑A IN :", msg);

  /* STEP‑1‑B: Promise를 return ― 포트 keep-alive 자동 */
  return fetch("http://localhost:8000/analyze", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(msg.payload)          // { content, source }
  })
    .then(async res => {
      const ct  = res.headers.get("content-type") || "";
      const raw = await res.text();

      console.log("[SW] STEP‑1‑B status", res.status, "| CT:", ct);
      console.log("[SW] raw 80:", raw.slice(0, 80));

      if (res.ok && ct.includes("application/json")) {
        console.log("[SW] STEP‑1‑C return ok");
        return { ok: true, data: JSON.parse(raw) };      // ⭐ return!
      }
      console.log("[SW] STEP‑1‑C return error");
      return { ok:false, error:`${res.status} ${raw.slice(0,120)}` };
    })
    .catch(err => ({ ok:false, error: err.message }));
});

chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  if (msg?.type !== "PING") return;
  console.log("BG got PING");
  sendResponse({ pong: Date.now() });   // 콜백 방식
  return true;
});