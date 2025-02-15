// 웹 페이지의 제목을 가져옴
const pageTitle = document.title;

console.log('웹페이지 제목',pageTitle);

// Background Script로 메세지 전송
chrome.runtime.sendMessage({ type:"saveTitle", title:pageTitle },(response)=>{
  console.log('백그라운드로부터의 응답: ', response);
});
