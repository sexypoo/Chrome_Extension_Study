// Content Script로부터 메세지를 받음
chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
  console.log(sender)
  
  console.log("받은 메세지: ",message);

  // Popup Script로 메세지 전송
  chrome.runtime.sendMessage({data:message.title},(response)=>{
      console.log("팝업으로부터 받은 메세지: ",response);
  });

  // Content Script로 응답 보내기
  sendResponse({status:"Content->Background 잘 받음!"});
  return true;
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "popupOpened") {
    console.log("팝업 열림!");

    chrome.runtime.sendMessage({ data: message.title }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error:", chrome.runtime.lastError);
      } else {
        console.log("Response from popup:", response);
      }
    });
  }
  sendResponse({ status: "Message received in background!" });
});