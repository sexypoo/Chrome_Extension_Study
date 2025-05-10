/* eslint-disable no-undef */
// ────────────────────────────────────────────────────────────
// 배경 Service-Worker (MV3) : 브라우저가 필요할 때만 띄웠다가 자동 언로드
// 1) 외부 API(Whois, SafeBrowsing) 조회
// 2) 악성 도메인 블랙리스트 주기 갱신
// 3) popup/content 와 메시지 라우팅
// ────────────────────────────────────────────────────────────

// ============= 0. 환경 설정 =============

  import CONFIG from './apikeys'
  
  // ============= 1. 유틸 함수 =============
  // (1) Whois 도메인 나이 (년) 가져오기
  async function getDomainAgeYears(domain) {
    const url =
      `https://api.whoisxmlapi.com/v1?apiKey=${CONFIG.WHOIS_API_KEY}&domainName=${domain}&outputFormat=JSON`;
    const r = await fetch(url);
    const j = await r.json();
    const created = j?.WhoisRecord?.createdDate;
    if (!created) return null;
  
    const years =
      (Date.now() - new Date(created).getTime()) / (1000 * 60 * 60 * 24 * 365);
    return Number(years.toFixed(1));
  }
  
  // (2) Google SafeBrowsing - 피싱/멀웨어 여부
  async function checkSafeBrowsing(url) {
    const api =
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${CONFIG.SAFEBROWSING_KEY}`;
    const body = {
      client: { clientId: 'trust-extension', clientVersion: '1.0' },
      threatInfo: {
        threatTypes: [
          'MALWARE',
          'SOCIAL_ENGINEERING',
          'UNWANTED_SOFTWARE',
          'POTENTIALLY_HARMFUL_APPLICATION',
        ],
        platformTypes: ['ANY_PLATFORM'],
        threatEntryTypes: ['URL'],
        threatEntries: [{ url }],
      },
    };
    const r = await fetch(api, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const j = await r.json();
    return !!j?.matches?.length; // true = 위험
  }
  
  // (3) 커스텀 블랙리스트 내려받아 storage 캐시
  async function updateBlacklist() {
    try {
      const r = await fetch(CONFIG.CUSTOM_BLACKLIST_URL);
      const list = await r.json(); // ["bad.com", "evil.net", ...]
      await chrome.storage.local.set({ blacklist: list, blTimestamp: Date.now() });
      console.log('[BG] 블랙리스트 업데이트 완료:', list.length, '개');
    } catch (e) {
      console.warn('[BG] 블랙리스트 업데이트 실패', e);
    }
  }
  
  // ============= 2. 알람 & 설치 시 초기화 =============
  chrome.runtime.onInstalled.addListener(() => {
    // 첫 설치 시 블랙리스트 즉시 갱신
    updateBlacklist();
    // 주기 알람(1시간) 등록
    chrome.alarms.create('BL_UPDATE', {
      periodInMinutes: CONFIG.BLACKLIST_CACHE_MIN,
    });
  });
  
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'BL_UPDATE') updateBlacklist();
  });
  
  // ============= 3. 메시지 라우팅 =============
  // popup.js ⇒  background ⇒  (외부 API)  ⇒  popup.js
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.type === 'EXTERNAL_CHECK') {
      (async () => {
        try {
          const url = new URL(msg.url);
          const domain = url.hostname;
  
          // ① 캐시에서 블랙리스트 조회
          const { blacklist = [] } = await chrome.storage.local.get('blacklist');
          const inBlacklist = blacklist.includes(domain);
  
          // ② Google SafeBrowsing
          const isDangerous = await checkSafeBrowsing(msg.url);
  
          // ③ Whois 도메인 나이
          const ageYears = await getDomainAgeYears(domain);
  
          sendResponse({ inBlacklist, isDangerous, ageYears });
        } catch (e) {
          console.error('[BG] EXTERNAL_CHECK error', e);
          sendResponse(null);
        }
      })();
      // async 응답 플래그
      return true;
    }
  });
  