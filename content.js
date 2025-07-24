// 图片放大器 - 主要功能实现

// 调试模式
const DEBUG = true;

// 调试日志函数
function log(message) {
  if (DEBUG) {
    console.log(`[图片放大器] ${message}`);
  }
}

// 默认设置
const defaultSettings = {
  magnifierSize: 'auto',
  borderColor: '#ffffff',
  borderWidth: 3,
  showLinkedMedia: true  // 是否显示链接中的图像/视频
};

// 当前设置
let currentSettings = {...defaultSettings};

// 获取链接中的媒体URL
function getLinkedMediaUrl(img) {
  try {
    // 检查图片是否在链接中
    const parentLink = img.closest('a');
    if (!parentLink) return null;
    
    const linkUrl = parentLink.href;
    if (!linkUrl) return null;
    
    log(`检测到链接中的图片: ${img.src}, 链接: ${linkUrl}`);
    
    // 检查链接是否直接指向媒体文件
    const mediaExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg|mp4|webm|ogg|mov)$/i;
    if (mediaExtensions.test(linkUrl)) {
      log(`链接指向媒体文件: ${linkUrl}`);
      return linkUrl;
    }
    
    // 特殊处理imgur链接
    if (linkUrl.includes('imgur.com')) {
      // 将imgur.com/abc转换为i.imgur.com/abc.jpg
      const imgurMatch = linkUrl.match(/imgur\.com\/([a-zA-Z0-9]+)/);
      if (imgurMatch && imgurMatch[1]) {
        return `https://i.imgur.com/${imgurMatch[1]}.jpg`;
      }
      // 保留原有的gallery处理逻辑
      if (linkUrl.includes('/gallery/')) {
        return linkUrl.replace('/gallery/', '/a/') + '.jpg';
      }
    }
    
    // 如果没有识别出媒体链接，返回null
    return null;
  } catch (error) {
    log(`获取链接媒体URL时出错: ${error.message}`);
    return null;
  }
}

// 创建放大预览元素
function createMagnifier() {
  // 检查是否已存在
  let magnifier = document.getElementById('image-magnifier');
  if (magnifier) {
    log('放大器元素已存在，重用现有元素');
    return magnifier;
  }
  
  log('创建新的放大器元素');
  magnifier = document.createElement('div');
  magnifier.id = 'image-magnifier';
  magnifier.style.display = 'none';
  document.body.appendChild(magnifier);
  log('放大器元素已添加到DOM');
  return magnifier;
}

// 应用设置到放大器
function applySettings(magnifier) {
  log('应用设置到放大器...');
  
  // 设置放大器大小
  // 如果是'auto'，则由图片原始尺寸决定，不在此处设置
  if (currentSettings.magnifierSize !== 'auto') {
    magnifier.style.width = `${currentSettings.magnifierSize}px`;
    magnifier.style.height = `${currentSettings.magnifierSize}px`;
    log(`设置放大器大小: ${currentSettings.magnifierSize}px`);
  }
  
  // 不再设置背景大小，使用CSS的background-size: contain显示整个图片
  
  // 设置边框颜色和宽度
  magnifier.style.borderColor = currentSettings.borderColor;
  magnifier.style.borderWidth = `${currentSettings.borderWidth}px`;
  log(`设置边框: ${currentSettings.borderWidth}px ${currentSettings.borderColor}`);
  
  // 设置三角形指示器颜色（与边框颜色相同）
  magnifier.style.setProperty('--triangle-color', currentSettings.borderColor);
  
  // 创建一个样式元素来设置CSS变量
  let styleEl = document.getElementById('magnifier-dynamic-style');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'magnifier-dynamic-style';
    document.head.appendChild(styleEl);
    log('创建了动态样式元素');
  }
  
  // 更新CSS样式
  styleEl.textContent = `
    #image-magnifier::after {
      border-top-color: ${currentSettings.borderColor};
    }
  `;
  log('更新了三角形指示器样式');
}

// 加载用户设置
function loadSettings() {
  log('加载用户设置...');
  return new Promise((resolve) => {
    // 如果chrome.storage可用（在扩展中运行）
    if (typeof chrome !== 'undefined' && chrome.storage) {
      log('使用chrome.storage加载设置');
      chrome.storage.sync.get(defaultSettings, (settings) => {
        currentSettings = settings;
        log(`已加载设置: ${JSON.stringify(currentSettings)}`);
        resolve();
      });
    } else {
      // 在测试页面中运行时使用默认设置
      log('chrome.storage不可用，使用默认设置');
      currentSettings = {...defaultSettings};
      log(`使用默认设置: ${JSON.stringify(currentSettings)}`);
      resolve();
    }
  });
}

// 初始化放大器功能
async function initMagnifier() {
  try {
    log('初始化放大器...');
    
    // 加载用户设置
    await loadSettings();
    log('设置已加载');
    
    // 创建放大预览元素
    const magnifier = createMagnifier();
    log('放大器元素已创建');
    
    // 应用设置
    applySettings(magnifier);
    log('设置已应用到放大器');
    
    // 获取页面上所有图片
    const images = document.querySelectorAll('img');
    log(`找到 ${images.length} 张图片`);
    
    if (images.length === 0) {
      log('警告: 页面上没有找到图片，可能是页面尚未完全加载或没有图片元素');
      // 设置一个延迟重试
      setTimeout(() => {
        const retryImages = document.querySelectorAll('img');
        log(`延迟重试: 找到 ${retryImages.length} 张图片`);
        retryImages.forEach(img => {
          if (img.complete) {
            if (img.width < 30 || img.height < 30) return;
            addImageListeners(img);
          } else {
            img.addEventListener('load', function() {
              if (this.width < 30 || this.height < 30) return;
              addImageListeners(this);
            });
          }
        });
      }, 1000);
    }
    
    // 为每个图片添加鼠标事件
    images.forEach((img, index) => {
      // 确保图片已加载完成
      if (img.complete) {
        // 检查图片是否在链接中
        const isInLink = img.closest('a') !== null;
        // 如果图片在链接中，不忽略小图片；否则忽略太小的图片（如图标）
        if (!isInLink && (img.width < 30 || img.height < 30)) return;
        addImageListeners(img);
      } else {
        // 如果图片尚未加载完成，等待加载
        img.addEventListener('load', function() {
          // 检查图片是否在链接中
          const isInLink = this.closest('a') !== null;
          // 如果图片在链接中，不忽略小图片；否则忽略太小的图片（如图标）
          if (!isInLink && (this.width < 30 || this.height < 30)) return;
          addImageListeners(this);
        });
      }
      
      // 事件监听器已在addImageListeners函数中添加
    });
    
    // 监听DOM变化，处理动态加载的图片
    log('设置MutationObserver以监听新图片...');
    const observer = new MutationObserver(mutations => {
      let newImagesCount = 0;
      
      mutations.forEach(mutation => {
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
          // 检查新添加的节点中是否有图片
          mutation.addedNodes.forEach(node => {
            // 如果节点本身是图片
            if (node.nodeName === 'IMG') {
              // 确保图片已加载完成
              if (node.complete) {
                addImageListeners(node);
                newImagesCount++;
              } else {
                // 如果图片尚未加载完成，等待加载
                node.addEventListener('load', function() {
                  addImageListeners(this);
                  newImagesCount++;
                });
              }
            } else if (node.querySelectorAll) {
              // 如果节点内部包含图片
              const newImages = node.querySelectorAll('img');
              newImagesCount += newImages.length;
              newImages.forEach(img => {
                // 确保图片已加载完成
                if (img.complete) {
                  addImageListeners(img);
                } else {
                  // 如果图片尚未加载完成，等待加载
                  img.addEventListener('load', function() {
                    addImageListeners(this);
                  });
                }
              });
            }
          });
        }
      });
      
      if (newImagesCount > 0) {
        log(`MutationObserver: 检测到 ${newImagesCount} 张新图片并添加了事件监听器`);
      }
    });
    
    // 为新添加的图片添加事件监听
    function addImageListeners(img) {
      // 检查图片是否在链接中
      const isInLink = img.closest('a') !== null;
      // 如果图片在链接中，不忽略小图片；否则忽略太小的图片
      if (!isInLink && (img.width < 30 || img.height < 30)) {
        log(`忽略小图片: ${img.alt || img.src}，尺寸: ${img.width}x${img.height}`);
        return;
      }
      
      log(`为图片添加事件监听: ${img.alt || img.src.substring(0, 50)}...`);
      
      // 获取放大器元素
      const magnifier = document.getElementById('image-magnifier');
      if (!magnifier) {
        log('错误: 找不到放大器元素!');
        return;
      }
      
      img.addEventListener('mouseenter', function() {
        log(`鼠标进入图片: ${this.alt || this.src.substring(0, 50)}...`);
        
        // 检查放大器元素是否存在
        if (!magnifier) {
          log('错误: 放大器元素不存在，尝试重新获取');
          magnifier = document.getElementById('image-magnifier');
          if (!magnifier) {
            log('错误: 无法获取放大器元素，尝试重新创建');
            magnifier = createMagnifier();
            applySettings(magnifier);
          }
        }
        
        try {
          // 检查是否有链接媒体URL
          let mediaUrl = null;
          if (currentSettings.showLinkedMedia) {
            mediaUrl = getLinkedMediaUrl(this);
          }
          
          // 确保图片URL有效
          const imgUrl = mediaUrl || this.src || this.currentSrc;
          if (!imgUrl) {
            log('错误: 无法获取图片URL');
            return;
          }
          
          // 如果是链接媒体，预加载图像以确保能正确显示
          if (mediaUrl) {
            log(`使用链接中的媒体: ${mediaUrl.substring(0, 50)}...`);
            
            // 检查是否是视频链接
            const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(mediaUrl);
            
            if (isVideo) {
              // 对于视频，创建一个视频元素作为背景
              const videoEl = document.createElement('video');
              videoEl.src = mediaUrl;
              videoEl.autoplay = true;
              videoEl.loop = true;
              videoEl.muted = true;
              videoEl.style.width = '100%';
              videoEl.style.height = '100%';
              videoEl.style.objectFit = 'cover';
              
              // 清除现有内容
              magnifier.innerHTML = '';
              magnifier.style.backgroundImage = '';
              magnifier.appendChild(videoEl);
              
              log(`添加视频背景: ${mediaUrl.substring(0, 50)}...`);
            } else {
              // 对于图片，设置为背景图
              const img = new Image();
              img.onload = function() {
                magnifier.style.backgroundImage = `url(${mediaUrl})`;
                log(`链接媒体图片加载完成: ${mediaUrl.substring(0, 50)}...`);
              };
              img.onerror = function() {
                log(`链接媒体图片加载失败，使用原图: ${this.src.substring(0, 50)}...`);
                magnifier.style.backgroundImage = `url(${this.src})`;
              };
              img.src = mediaUrl;
              
              // 立即设置背景，不等待加载完成
              magnifier.style.backgroundImage = `url(${mediaUrl})`;
            }
            
            // 记录原始和链接媒体URL
            magnifier.dataset.originalSrc = this.src;
            magnifier.dataset.linkedMediaSrc = mediaUrl;
          } else {
            // 使用原始图片
            magnifier.style.backgroundImage = `url(${imgUrl})`;
            magnifier.dataset.originalSrc = imgUrl;
            log(`设置背景图: ${imgUrl.substring(0, 50)}...`);
          }
        } catch (error) {
          log(`设置背景图时出错: ${error.message}`);
        }
        
        // 显示放大器
        magnifier.style.display = 'block';
        log('放大器已显示');

        
        // 检查放大器是否真的显示了
          setTimeout(() => {
            if (magnifier.style.display === 'block') {
              log('确认: 放大器显示状态正常');
            } else {
              log('错误: 放大器应该显示但实际未显示');
            }
          }, 50);

          // 如果是自动调整大小模式，根据图片原始尺寸和视口大小设置放大器大小
          if (currentSettings.magnifierSize === 'auto') {
            const imgElement = this; // 当前触发事件的图片元素
            const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            
            // 确保图片已加载完成，可以获取到原始尺寸
            if (imgElement.complete) {
              // 计算图片的宽高比
              const aspectRatio = imgElement.naturalWidth / imgElement.naturalHeight;
              
              // 设置最大尺寸为视口的80%
              const maxWidth = viewportWidth * 1;
              const maxHeight = viewportHeight * 1;
              
              // 根据宽高比和视口限制计算实际尺寸
              let width = imgElement.naturalWidth;
              let height = imgElement.naturalHeight;
              
              // 如果宽度超出限制
              if (width > maxWidth) {
                width = maxWidth;
                height = width / aspectRatio;
              }
              
              // 如果高度超出限制
              if (height > maxHeight) {
                height = maxHeight;
                width = height * aspectRatio;
              }
              
              magnifier.style.width = `${width}px`;
              magnifier.style.height = `${height}px`;
              
              log(`放大器大小设置为: ${width}x${height}, 原始尺寸: ${imgElement.naturalWidth}x${imgElement.naturalHeight}`);
            } else {
              // 如果图片未加载完成，等待加载后再设置大小
              imgElement.onload = () => {
                // 计算图片的宽高比
                const aspectRatio = imgElement.naturalWidth / imgElement.naturalHeight;
                
                // 设置最大尺寸为视口的80%
                const maxWidth = viewportWidth * 1;
                const maxHeight = viewportHeight * 1;
                
                // 根据宽高比和视口限制计算实际尺寸
                let width = imgElement.naturalWidth;
                let height = imgElement.naturalHeight;
                
                // 如果宽度超出限制
                if (width > maxWidth) {
                  width = maxWidth;
                  height = width / aspectRatio;
                }
                
                // 如果高度超出限制
                if (height > maxHeight) {
                  height = maxHeight;
                  width = height * aspectRatio;
                }
                
                magnifier.style.width = `${width}px`;
                magnifier.style.height = `${height}px`;
                
                log(`图片加载后，放大器大小设置为: ${width}x${height}, 原始尺寸: ${imgElement.naturalWidth}x${imgElement.naturalHeight}`);
              };
            }
          }
      });
      
      img.addEventListener('mousemove', function(e) {
         try {
           // 设置放大器的位置（在鼠标上方）
           const magnifierRect = magnifier.getBoundingClientRect();
           
           // 获取视口尺寸
           const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
           const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

           // 考虑页面滚动位置
           const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
           const scrollY = window.pageYOffset || document.documentElement.scrollTop;

           // 放大器尺寸
           const magnifierWidth = magnifierRect.width;
           const magnifierHeight = magnifierRect.height;

           // 鼠标相对于视口的位置
           const mouseX = e.clientX;
           const mouseY = e.clientY;

           let newMagnifierLeft;
           let newMagnifierTop;

           // 尝试将放大器放在鼠标右侧
           const rightOffset = 20; // 鼠标右侧偏移量
           const verticalOffset = 20; // 垂直偏移量
           newMagnifierLeft = mouseX + rightOffset;
           
           // 智能计算垂直位置
           if (mouseY - magnifierHeight / 2 < 0) {
             // 如果放在中间会超出顶部，则放在鼠标下方
             newMagnifierTop = mouseY + verticalOffset;
           } else if (mouseY + magnifierHeight / 2 > viewportHeight) {
             // 如果放在中间会超出底部，则放在鼠标上方
             newMagnifierTop = mouseY - magnifierHeight - verticalOffset;
           } else {
             // 默认放在垂直居中位置
             newMagnifierTop = mouseY - magnifierHeight / 2;
           }

           // 检查是否超出右侧视口
           if (newMagnifierLeft + magnifierWidth > viewportWidth) {
             // 如果超出右侧，尝试放在鼠标左侧
             const leftOffset = 20; // 鼠标左侧偏移量
             newMagnifierLeft = mouseX - magnifierWidth - leftOffset;
             
             // 如果放在左侧也超出视口（超出左边界），则选择最合适的位置
             if (newMagnifierLeft < 0) {
               // 比较左右两侧的可用空间，选择空间较大的一侧
               const leftSpace = mouseX;
               const rightSpace = viewportWidth - mouseX;
               
               if (rightSpace > leftSpace) {
                 // 如果右侧空间更大，放在右侧贴边
                 newMagnifierLeft = viewportWidth - magnifierWidth;
               } else {
                 // 如果左侧空间更大，放在左侧贴边
                 newMagnifierLeft = 0;
               }
             }
           }

           // 确保放大器不会超出视口顶部
           if (newMagnifierTop < 0) {
             newMagnifierTop = 0;
           }

           // 确保放大器不会超出视口底部
           if (newMagnifierTop + magnifierHeight > viewportHeight) {
             newMagnifierTop = viewportHeight - magnifierHeight;
           }

           // 加上滚动位置，转换为文档坐标
           magnifier.style.left = `${newMagnifierLeft + scrollX}px`;
           magnifier.style.top = `${newMagnifierTop + scrollY}px`;
           


           
           // 每10次移动记录一次日志，避免日志过多
           if (Math.random() < 0.1) {
             log(`鼠标移动: 位置(${Math.round(newMagnifierLeft)},${Math.round(newMagnifierTop)})`);
           }
         } catch (error) {
           log(`鼠标移动处理错误: ${error.message}`);
         }
      });
      
      img.addEventListener('mouseleave', function() {
        log(`鼠标离开图片: ${this.alt || this.src.substring(0, 50)}...`);
        
        // 隐藏放大器
        magnifier.style.display = 'none';
        
        // 如果有视频元素，停止播放并移除
        const videoEl = magnifier.querySelector('video');
        if (videoEl) {
          try {
            videoEl.pause();
            videoEl.remove();
            log('视频元素已停止并移除');
          } catch (error) {
            log(`清理视频元素时出错: ${error.message}`);
          }
        }
        
        log('放大器已隐藏');
      });
    }
    
    // 开始观察整个文档的变化
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    log('MutationObserver已启动');
    
    log('初始化完成!');
  } catch (error) {
    log(`初始化过程中发生错误: ${error.message}`);
    console.error('图片放大器初始化错误:', error);
  }
}

// 页面加载完成后初始化放大器
document.addEventListener('DOMContentLoaded', function() {
  log('DOMContentLoaded 事件触发');
  initMagnifier();
});

// 确保在页面已经加载完成的情况下也能初始化
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  log(`页面已加载 (readyState: ${document.readyState})，立即初始化`);
  initMagnifier();
}

// 监听设置变化
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
      // 更新当前设置
      for (let key in changes) {
        if (currentSettings.hasOwnProperty(key)) {
          currentSettings[key] = changes[key].newValue;
        }
      }
      
      // 获取现有的放大器元素
      const magnifier = document.getElementById('image-magnifier');
      if (magnifier) {
        // 应用新设置
        applySettings(magnifier);
      }
    }
  });
}