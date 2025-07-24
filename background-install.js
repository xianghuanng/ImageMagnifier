// 图片放大器 - 安装后的初始化处理

// 监听插件安装事件
chrome.runtime.onInstalled.addListener(function(details) {
  // 在首次安装时进行必要的初始化设置
  if (details.reason === 'install') {
    // 设置默认配置
    chrome.storage.sync.set({
      enabled: true,  // 默认启用插件
      magnifierSize: 'auto',  // 默认放大器尺寸为自动
      borderColor: '#ffffff',  // 默认边框颜色为白色
      borderWidth: 3,  // 默认边框宽度为3像素
      showLinkedMedia: true  // 默认启用显示链接中的图像/视频
    });
  }
});