// popup.js
document.getElementById("myButton").addEventListener("click", () => {
    alert("알람이지롱");
  });

// 현재 활성 탭의 URL을 가져오는 함수
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

    if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError); // 에러가 발생하면 콘솔에 출력
        return;
      }
      
    const currentTab = tabs[0]; // 현재 탭 정보
    const url = currentTab.url; // 현재 탭의 URL
    document.getElementById("url").textContent = url; // 화면에 URL 표시
  });