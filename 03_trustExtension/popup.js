// popup.js ─ 점수 + 근거 표시용
(() => {
  const d = (...a) => false && console.log('[popup]', ...a); // DEBUG용

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('check');
    const res = document.getElementById('result');
    const ul  = document.getElementById('reasons');

    btn.addEventListener('click', () => analyse(res, ul));
  });

  async function analyse(resEl, ulEl) {
    resEl.textContent = '분석 중... ⏳';
    ulEl.innerHTML = '';

    const [tab] = await chrome.tabs.query({ active:true, currentWindow:true });
    if (!tab?.id) { resEl.textContent = '탭 인식 실패'; return; }

    // ① content.js 메트릭
    let m = await send(tab.id);
    if (!m) m = await fallback(tab.id);
    if (!m) { resEl.textContent = '분석 실패 😵'; return; }

    // ② background.js 외부 진단
    const x = await extCheck(tab.url);

    // ③ 점수 & 이유
    const { score, reasons } = calc(m, x);

    // ④ UI 출력
    const label = score>=70? '높음 👍' : score>=50? '보통 😐' : '낮음 ⚠️';
    resEl.textContent = `결과: ${label} (점수 ${score})`;

    ulEl.innerHTML = reasons
      .map(r => `<li class="${r.delta>0?'pos':'neg'}">${r.msg} (${r.delta>0?'+':''}${r.delta})</li>`)
      .join('');
  }

  // ───── helper: content.js ↔ 메시지
  const send = id => new Promise(r=>chrome.tabs.sendMessage(id,{type:'REQUEST_METRICS'},resp=>r(resp??null)));
  // ───── helper: fallback executeScript
  async function fallback(id){
    try{
      const [{result}] = await chrome.scripting.executeScript({
        target:{tabId:id}, func:()=>{/* collectMetrics 복붙 */return (()=>{
          const https  = location.protocol==='https:';
          const ttlLen = (document.title||'').trim().length;
          const text   = (document.body?.innerText||'').trim();
          const wc     = text.split(/\s+/).filter(Boolean).length;
          const links  = [...document.querySelectorAll('a[href]')];
          const extR   = links.length? links.filter(a=>{try{return new URL(a.href).origin!==location.origin}catch{return false}}).length/links.length:0;
          return {https,titleLength:ttlLen,wordCount:wc,externalRatio:extR};
        })();}
      });
      return result;
    }catch{return null}
  }
  // ───── helper: background.js 메시지
  const extCheck = url => new Promise(r=>chrome.runtime.sendMessage({type:'EXTERNAL_CHECK',url},resp=>r(resp??null)));

  // ───── 점수 & 이유 계산
  function calc(m,x){
    let s=0, reasons=[];
    const push=(cond,delta,msg)=>{ if(cond){ s+=delta; reasons.push({delta,msg}); } };

    // 기본 메트릭
    push(m.https,               +30,'HTTPS 사용');
    push(m.titleLength>10,      +10,'제목 길이 양호');
    push(m.wordCount>300,       +20,'본문 분량 충분');
    push(m.externalRatio<0.3,   +10,'외부 링크 비율 낮음');

    // 외부/보안
    if(x){
      push(x.inBlacklist,       -40,'블랙리스트 도메인');
      push(x.isDangerous,       -30,'SafeBrowsing 위험 탐지');
      if(x.ageYears!==null) push(x.ageYears<1?-10:0,
                                 x.ageYears<1?'도메인 신규(<1년)':`도메인 ${x.ageYears.toFixed(1)}년 경과`);
    }

    // 범위 클램프
    s = Math.max(0, Math.min(100, s));
    return { score:s, reasons };
  }
})();
