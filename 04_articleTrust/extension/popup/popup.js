chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.tabs.sendMessage(tab.id, { type: "GET_LAST_RESULT" }, (data) => {
      document.getElementById("result").textContent =
        data ? JSON.stringify(data, null, 2) : "아직 분석되지 않았습니다.";
    });
  });