// 图片放大器 - 背景脚本
// 目前插件功能主要通过content.js实现，此文件为将来扩展功能预留

// 监听插件安装事件
chrome.runtime.onInstalled.addListener(function() {
  console.log('图片放大器插件已安装');
});