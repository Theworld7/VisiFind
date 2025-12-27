// Chrome Extension Background Service Worker

// 监听扩展安装事件
chrome.runtime.onInstalled.addListener(() => {
  console.log('寻影浏览器主页扩展已安装');
});

// 可以在此处添加扩展相关功能
