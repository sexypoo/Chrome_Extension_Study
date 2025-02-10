window.onload = () =>{
  
  // 팝업이 열리면 Background Script로 메세지 요청!
  chrome.runtime.sendMessage({action:"popupOpened"},(response)=>{
    if (chrome.runtime.lastError){
      console.error("Error: ",chrome.runtime.lastError);
    }
    else{
      console.log("백그라운드에서 온 메세지: ",response);
    }
  });

  // Background Script로부터 메세지를 받음
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("받은 메세지:", message);

    // 데이터를 화면에 표시
    if (message.data) {
      document.getElementById("title").textContent = message.data;
    }

    // Background Script로 응답 보내기
    sendResponse({ status: "Background->Popup 잘 받음!" });
    return true;
  });
};