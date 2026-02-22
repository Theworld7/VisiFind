// Firefox/Chrome Extension Background Script

// 兼容处理：火狐使用 browser 命名空间，Chrome 使用 chrome
const chrome = typeof browser !== 'undefined' ? browser : chrome

// 监听扩展安装事件
chrome.runtime.onInstalled.addListener(() => {
  console.log('寻影浏览器主页扩展已安装')
})

// 可以在此处添加扩展相关功能
