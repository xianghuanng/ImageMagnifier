// 图片放大器 - 弹出窗口脚本

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
  // 获取按钮元素
  const settingsButton = document.getElementById('settings-button');
  const testButton = document.getElementById('test-button');
  

  
  // 打开设置页面
  settingsButton.addEventListener('click', function() {
    if (chrome.runtime.openOptionsPage) {
      // 新版Chrome浏览器支持的API
      chrome.runtime.openOptionsPage();
    } else {
      // 兼容旧版本
      window.open(chrome.runtime.getURL('options.html'));
    }
  });
  
  // 打开帮助页面（原测试页面）
  testButton.addEventListener('click', function() {
    // 在新标签页中打开帮助页面
    chrome.tabs.create({ url: chrome.runtime.getURL('help.html') });
  });
  

});