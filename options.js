// 图片放大器 - 选项页面脚本

// 默认设置
const defaultSettings = {
  magnifierSize: 'auto',
  borderColor: '#ffffff',
  borderWidth: 3,
  showLinkedMedia: true
};

// DOM 元素
const elements = {
  autoSize: document.getElementById('auto-size'),
  borderColor: document.getElementById('border-color'),
  borderPreview: document.getElementById('border-preview'),
  borderWidth: document.getElementById('border-width'),
  borderWidthValue: document.getElementById('border-width-value'),
  showLinkedMedia: document.getElementById('show-linked-media'),
  saveButton: document.getElementById('save-button'),
  statusMessage: document.getElementById('status-message')
};

// 加载保存的设置
function loadSettings() {
  chrome.storage.sync.get(defaultSettings, (settings) => {
    // 更新UI元素的值
    elements.autoSize.checked = settings.magnifierSize === 'auto';
    
    elements.borderColor.value = settings.borderColor;
    elements.borderPreview.style.backgroundColor = settings.borderColor;
    
    elements.borderWidth.value = settings.borderWidth;
    elements.borderWidthValue.textContent = `${settings.borderWidth}px`;
    
    // 设置显示链接媒体的复选框
    elements.showLinkedMedia.checked = settings.showLinkedMedia !== false;
  });
}

// 保存设置
function saveSettings() {
  const settings = {
    magnifierSize: elements.autoSize.checked ? 'auto' : 250,
    borderColor: elements.borderColor.value,
    borderWidth: parseInt(elements.borderWidth.value),
    showLinkedMedia: elements.showLinkedMedia.checked
  };
  
  chrome.storage.sync.set(settings, () => {
    // 显示保存成功消息
    elements.statusMessage.textContent = '设置已保存！';
    
    // 3秒后清除消息
    setTimeout(() => {
      elements.statusMessage.textContent = '';
    }, 3000);
  });
}

// 添加事件监听器
function setupEventListeners() {
  // 边框颜色选择器
  elements.borderColor.addEventListener('input', () => {
    elements.borderPreview.style.backgroundColor = elements.borderColor.value;
  });
  
  // 边框宽度滑块
  elements.borderWidth.addEventListener('input', () => {
    elements.borderWidthValue.textContent = `${elements.borderWidth.value}px`;
  });
  
  // 保存按钮
  elements.saveButton.addEventListener('click', saveSettings);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  setupEventListeners();
});