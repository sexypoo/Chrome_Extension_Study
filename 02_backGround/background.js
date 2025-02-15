// Content Script로부터 메세지를 받음
chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{

  if (message.type == "saveTitle"){ // Content Script로부터 온 요청이라면
    pageTitle = message.title;
    sendResponse({status:'제목 저장 완료'});
    return true;
  }
  else if (message.type=="getTitle"){ // Popup Script로부터 온 요청이라면
    sendResponse({title:pageTitle});
    return true;
  }

});