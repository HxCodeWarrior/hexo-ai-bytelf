/**
 * ByteElf 思维导图增强脚本
 * 用于增强思维导图的交互性和展示效果
 */
(function() {
  // 等待文档加载完成
  document.addEventListener('DOMContentLoaded', function() {
    // 查找所有思维导图容器
    const mindmapContainers = document.querySelectorAll('.mindmap-container');
    
    if (mindmapContainers.length === 0) return;
    
    // 处理每个思维导图
    mindmapContainers.forEach(function(container) {
      // 添加折叠/展开功能
      addToggleFeature(container);
      
      // 添加动画效果
      addAnimationEffect(container);
    });
  });
  
  /**
   * 为思维导图添加折叠/展开功能
   * @param {HTMLElement} container 思维导图容器
   */
  function addToggleFeature(container) {
    const content = container.querySelector('.mindmap-content');
    if (!content) return;
    
    // 查找所有有子列表的列表项
    const listItems = content.querySelectorAll('li');
    
    listItems.forEach(function(item) {
      // 检查是否有子列表
      const subList = item.querySelector('ul');
      if (!subList) return;
      
      // 创建折叠/展开按钮
      const toggleBtn = document.createElement('span');
      toggleBtn.className = 'mindmap-toggle';
      toggleBtn.innerHTML = '▼';
      
      // 在列表项文本前插入按钮
      item.insertBefore(toggleBtn, item.firstChild);
      
      // 添加点击事件
      toggleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // 切换子列表的显示状态
        if (subList.style.display === 'none') {
          subList.style.display = '';
          toggleBtn.style.transform = 'rotate(0deg)';
        } else {
          subList.style.display = 'none';
          toggleBtn.style.transform = 'rotate(-90deg)';
        }
      });
    });
  }
  
  /**
   * 为思维导图添加动画效果
   * @param {HTMLElement} container 思维导图容器
   */
  function addAnimationEffect(container) {
    // 添加鼠标悬停效果
    const listItems = container.querySelectorAll('li');
    
    listItems.forEach(function(item) {
      item.addEventListener('mouseenter', function() {
        this.style.backgroundColor = 'rgba(50, 115, 220, 0.1)';
        this.style.borderRadius = '3px';
        this.style.transition = 'background-color 0.3s';
      });
      
      item.addEventListener('mouseleave', function() {
        this.style.backgroundColor = '';
      });
    });
  }
})();