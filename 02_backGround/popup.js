window.onload = () =>{

  chrome.runtime.sendMessage({type:"getTitle"},(response)=>{
    console.log("Background로부터 받은 제목 : ",response.title);
    document.getElementById("title").textContent = response.title || '제목 없음';
  });
}