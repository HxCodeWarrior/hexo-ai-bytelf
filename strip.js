module.exports = function strip(content, title, config) {
  const ignoreRules = config.ignoreRules || [];
  const logLevel = config.logger ?? 1; // 默认为 NORMAL

  // 1. 应用忽略规则
  if (Array.isArray(ignoreRules) && ignoreRules.length > 0) {
    ignoreRules.forEach(rule => {
      const regex = new RegExp(rule, 'g');
      content = content.replace(regex, '');
    });
  } else {
    if (logLevel >= 1) {
      console.warn('[Hexo-AI-Byte-Elf] ignore_rules 未设置或无效，跳过处理');
    }
  }

  // 在 NORMAL 或 VERBOSE 日志等级时输出原始字符串长度
  if (logLevel >= 1) {
    console.log('[Hexo-AI-Byte-Elf] 原始字符串长度：', content.length);
  }

  // 2. 清理内容
  content = content
    // 代码相关
    .replace(/```[\s\S]*?```/g, '')           // 代码块
    .replace(/`[^`\n]+`/g, '')                // 行内代码
    
    // 数学公式
    .replace(/\$\$[\s\S]*?\$\$/g, '')         // LaTeX 数学公式块
    .replace(/\$[^\$\n]+\$/g, '')            // 行内 LaTeX 公式
    
    // Hexo 特殊标签
    .replace(/{%[^%]*%}/g, '')                // Hexo 标签
    .replace(/{\s*[a-zA-Z_][^}]*}/g, '')     // 其他模板标签
    
    // Markdown 元素
    .replace(/^\|.*?\|.*$\n\|[-:\|\s]*\|.*$/gm, '') // 删除表格分隔行和内容行
    .replace(/!\[.*?\]\(.*?\)/g, '')          // 图片
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')       // 超链接文本
    
    // HTML 元素
    .replace(/<[^>]+>/g, '')                  // HTML 标签
    .replace(/&[a-zA-Z]+;/g, ' ')            // HTML 实体
    
    // 空白处理
    .replace(/\n{2,}/g, '\n')                 // 多重换行压缩
    .replace(/^\s+|\s+$/gm, '')               // 行首尾空格
    .replace(/[ \t]+/g, ' ')                  // 多空格压缩
    .trim();

  // 3. 拼接标题
  const combined = (title ? title.trim() + '\n\n' : '') + content;

  // 4. 截断处理
  const maxLen = typeof config.max_token === 'number' ? config.max_token : 1000;
  let final = combined;
  if (combined.length > maxLen) {
    final = combined.slice(0, maxLen).trim() + '...';
  }

  // 在 NORMAL 或 VERBOSE 日志等级时输出最终输出长度
  if (logLevel >= 1) {
    console.log('[Hexo-AI-Byte-Elf] 最终输出长度：', final.length);
  }

  return final;
};