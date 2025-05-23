const strip = require('./strip')
const { ai, generateSummary } = require('./ai')
const generateMindmap = require('./mindmap')
const fs = require('hexo-fs')
const fm = require('hexo-front-matter')
const pLimit = require('p-limit')
const path = require('path')

const config = hexo.config.bytelf || {}
if (!config.api) {
    console.error('[Hexo-AI-ByteElf] 请在配置文件中设置 api')
    return
}

const limit = pLimit(config.concurrency || 2)  // 设置最大并发数，比如 2
const fieldName = config.summary_field || 'summary'   // 默认为 'summary'
const mindmapField = config.mindmap_field || 'mindmap' // 思维导图字段名

// 日志等级枚举
const LOG_LEVELS = {
    SILENT: 0,   // 只输出错误
    NORMAL: 1,   // 输出错误和需要生成摘要的文章
    VERBOSE: 2   // 输出所有信息，包括跳过的文章
}

// 获取当前的日志等级，默认为 NORMAL
const logLevel = config.logger ?? LOG_LEVELS.NORMAL

// 获取样式配置
const summaryStyle = config.summary_style || {}
const mindmapStyle = config.mindmap_style || {}

// 添加样式资源
hexo.extend.generator.register('byteelf_assets', () => {
  if (!config.enable_style) return [];
  
  const assets = [];
  
  // 摘要样式
  if (config.enable_summary) {
    assets.push({
      path: 'css/byteelf-summary.css',
      data: function() {
        return fs.createReadStream(require('path').join(__dirname, 'assets/byteelf-summary.css'));
      }
    });
  }
  
  // 思维导图样式
  if (config.enable_mindmap) {
    assets.push({
      path: 'css/byteelf-mindmap.css',
      data: function() {
        return fs.createReadStream(require('path').join(__dirname, 'assets/byteelf-mindmap.css'));
      }
    });
  }
  
  return assets;
});

// 注入样式
hexo.extend.injector.register('head_end', () => {
  let styles = '';
  
  if (config.enable_style && config.enable_summary) {
    styles += '<link rel="stylesheet" href="/css/byteelf-summary.css">';
  }
  
  if (config.enable_style && config.enable_mindmap) {
    styles += '<link rel="stylesheet" href="/css/byteelf-mindmap.css">';
    
    // 如果启用了背景图，添加自定义属性
    if (config.mindmap_style && config.mindmap_style.enable_bg && config.mindmap_style.bg_path) {
      styles += `<style>:root { --mindmap-bg-image: url('${config.mindmap_style.bg_path}'); }</style>`;
    }
  }
  
  return styles;
});

hexo.extend.injector.register('body_end', () => {
  if (config.enable_style === false) return '';
  return `<script src="/js/byteelf-mindmap.js"></script>`;
});

// 自定义摘要渲染助手
hexo.extend.helper.register('render_summary', function(summary) {
  if (!summary) return '';
  
  const bgClass = summaryStyle.enable_bg ? ' with-bg' : '';
  const customClass = summaryStyle.custom_class ? ` ${summaryStyle.custom_class}` : '';
  const icon = summaryStyle.icon || '✨';
  const title = summaryStyle.title || '摘要';
  
  // 自定义样式
  let customStyle = '';
  if (summaryStyle.enable_bg && summaryStyle.bg_path) {
    customStyle = ` style="background-image: url('${summaryStyle.bg_path}')"`;
  }
  
  return `<div class="byteelf-summary${bgClass}${customClass}"${customStyle} data-icon="${icon}" data-title="${title}">${summary}</div>`;
});

// 自定义思维导图渲染助手
hexo.extend.helper.register('render_mindmap', function(mindmap) {
  if (!mindmap) return '';
  
  const bgClass = mindmapStyle.enable_bg ? ' with-bg' : '';
  const customClass = mindmapStyle.custom_class ? ` ${mindmapStyle.custom_class}` : '';
  const title = mindmapStyle.title || '思维导图';
  
  // 自定义样式
  let customStyle = '';
  if (mindmapStyle.enable_bg && mindmapStyle.bg_path) {
    customStyle = ` style="background-image: url('${mindmapStyle.bg_path}')"`;
  }
  
  // 处理 Markdown 格式的思维导图
  let mindmapContent = mindmap;
  if (config.mindmap && config.mindmap.format === 'markdown') {
    // 简单转换 Markdown 列表为 HTML 列表
    mindmapContent = mindmapToHtml(mindmap);
  }
  
  return `<div class="mindmap-container${bgClass}${customClass}"${customStyle}>
    <div class="mindmap-title">${title}</div>
    <div class="mindmap-content">${mindmapContent}</div>
  </div>`;
});

// 将 Markdown 格式的思维导图转换为 HTML
function mindmapToHtml(markdown) {
  if (!markdown) return '';
  
  // 分割行
  const lines = markdown.split('\n');
  let html = '<ul>';
  let prevLevel = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // 计算当前行的缩进级别
    const match = line.match(/^(\s*)-\s+(.+)$/);
    if (!match) continue;
    
    const indent = match[1].length;
    const content = match[2];
    const level = Math.floor(indent / 2) + 1;
    
    // 根据缩进级别调整 HTML 结构
    if (level > prevLevel) {
      // 增加嵌套
      html += '<ul>';
    } else if (level < prevLevel) {
      // 减少嵌套
      for (let j = 0; j < prevLevel - level; j++) {
        html += '</ul></li>';
      }
    } else if (i > 0) {
      // 同级，关闭前一个项
      html += '</li>';
    }
    
    // 添加当前项
    html += `<li>${content}`;
    
    prevLevel = level;
  }
  
  // 关闭所有剩余的标签
  for (let i = 0; i < prevLevel; i++) {
    html += '</li></ul>';
  }
  
  return html;
}

hexo.extend.filter.register('before_post_render', async function (data) {
    
    // 检查是否为文章页面
    if (data.layout != 'post' || !data.source.startsWith('_posts/')) {
        if (logLevel >= LOG_LEVELS.VERBOSE) {
            console.info(`[Hexo-AI-ByteElf] 跳过 ${data.title}，不是文章页面`)
        }
        return data
    }

    return await limit(async () => {
        if (!config.enable && !data.is_summary) {
            if (logLevel >= LOG_LEVELS.VERBOSE) {
                console.info(`[Hexo-AI-ByteElf] 文章 ${data.title} 被标记为不进行摘要，跳过`)
            }
            return data
        }
        
        // 处理摘要生成
        const needSummary = config.enable_summary !== false && 
                          (!data[fieldName] || data[fieldName].length === 0 || config.cover_all === true);
        
        // 处理思维导图生成
        const needMindmap = config.enable_mindmap === true && 
                          (!data[mindmapField] || data[mindmapField].length === 0 || config.cover_all === true);
        
        if (!needSummary && !needMindmap) {
            if (logLevel >= LOG_LEVELS.VERBOSE) {
                console.info(`[Hexo-AI-ByteElf] 文章 ${data.title} 已有摘要和思维导图，跳过`)
            }
            return data
        }

        let content = strip(data.content, data.title, config)
        const path = this.source_dir + data.source
        const frontMatter = fm.parse(await fs.readFile(path))
        // 去掉 frontMatter 中的 _content，并保存到 MdContent 变量中，删除MDContent 文本开始可能存在的换行符
        const MdContent = frontMatter._content.replace(/^\n+|\n+$/g, '')
        delete frontMatter._content

        try {
            // 生成摘要
            if (needSummary) {
                const summaryConfig = config.summary || {}
                const temperature = summaryConfig.temperature || 0.7
                
                const ai_content = await generateSummary(
                    config.token,
                    config.api,
                    config.model,
                    content,
                    data.title,
                    config
                )

                // 检测内容是否为空，是否有换行，是否有#,$,%之类的特殊字符
                if (!ai_content || ai_content.length < 10 || /[\n#$%]/.test(ai_content)) {
                    if (logLevel >= LOG_LEVELS.NORMAL) {
                        console.info(`[Hexo-AI-ByteElf] 文章 ${data.title} 的摘要内容不符合要求，跳过`)
                    }
                    if (logLevel >= LOG_LEVELS.VERBOSE) {
                        console.info(`[Hexo-AI-ByteElf] 文章 ${data.title} 的摘要内容为：${ai_content}`)
                    }
                } else {
                    frontMatter[fieldName] = data[fieldName] = ai_content
                    if (logLevel >= LOG_LEVELS.NORMAL) {
                        console.info(`[Hexo-AI-ByteElf] 摘要 ${data.title} 完成`)
                    }
                }
            }
            
            // 生成思维导图
            // 处理思维导图生成
            if (needMindmap && config.enable_mindmap) {
              try {
                const mindmap_content = await generateMindmap(
                  config.token,
                  config.api,
                  config.model,
                  content,
                  data.title,
                  config  // 传递整个配置对象
                )
                
                if (mindmap_content && mindmap_content.length > 20) {
                  frontMatter[mindmapField] = data[mindmapField] = mindmap_content
                  if (logLevel >= LOG_LEVELS.NORMAL) {
                    console.info(`[Hexo-AI-ByteElf] 思维导图 ${data.title} 完成`)
                  }
                } else {
                  if (logLevel >= LOG_LEVELS.NORMAL) {
                    console.info(`[Hexo-AI-ByteElf] 文章 ${data.title} 的思维导图内容不符合要求，跳过`)
                  }
                }
              } catch (mindmapErr) {
                if (logLevel >= LOG_LEVELS.SILENT) {
                  console.error(`[Hexo-AI-ByteElf] 生成思维导图失败：${data.title}\n${mindmapErr.message}`)
                }
              }
            }

            // 写入文件
            await fs.writeFile(path, `---\n${fm.stringify(frontMatter)}\n${MdContent}`)
            
        } catch (err) {
            if (logLevel >= LOG_LEVELS.SILENT) {
                console.error(`[Hexo-AI-ByteElf] 处理失败：${data.title}\n${err.message}`)
            }
        }

        return data
    })
})
