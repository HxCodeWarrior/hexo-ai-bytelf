// 核心模块引入
const strip = require('./strip');         // 内容清洗模块
const ai = require('./ai');               // AI服务入口
const fs = require('hexo-fs');            // 增强版文件系统
const fm = require('hexo-front-matter');  // Front Matter解析器
const pLimit = require('p-limit');        // 并发控制
const SummaryCache = require('./cache');  // 缓存系统
const { validateConfig, log, LOG_LEVELS } = require('./utils');  // 工具函数
const yaml = require('js-yaml');          // YAML处理器

// 配置加载与验证
const config = hexo.config.byte_ai_summary || {};  // 从Hexo配置合并
const configErrors = validateConfig(config);       // 执行配置校验

// 配置错误处理（严重错误直接终止）
if (configErrors.length > 0) {
  log(0, '配置错误：\n' + configErrors.join('\n'));
  return;
}

// 初始化并发控制系统（默认并发数2）
const limit = pLimit(config.concurrency || 2);
// 摘要字段名称配置（默认'summary'）
const fieldName = config.summary_field || 'summary';
// 默认提示词（可被配置覆盖）
const defaultPrompt = config.prompt || '请为这些内容生成一个简短的摘要：';
// 初始化缓存系统（基于LRU）
const cache = new SummaryCache(config.cacheDir);

// 注册Hexo文章预处理钩子
hexo.extend.filter.register('before_post_render', async function (data) {
  // 1.跳过非文章页面（根据路径和布局判断）
  if (
    data.layout !== 'post' || 
    !data.raw ||
    !data.content ||
    !data.source.startsWith('_posts/')
  ) {
    log(2, `跳过 ${data.title}，不是文章页面`);
    return data;
  }

  return await limit(async () => {
    try {
      // 2.全局开关检查（配置enable和文章is_summary标记）
      if (!config.enable && !data.is_summary) {
        log(2, `文章 ${data.title} 被标记为不进行摘要，跳过`);
        return data;
      }

      // 3.已有摘要检查（cover_all配置可强制覆盖）
      if (data[fieldName] && data[fieldName].length > 0 && config.cover_all !== true) {
        log(2, `文章 ${data.title} 已经有摘要，跳过`);
        return data;
      }

      // 4.内容预处理（去除Markdown格式、广告等）
      let content = strip(data.content, data.title, config);
      
      // 5.缓存查询（基于内容哈希）
      let summary = cache.get(content, config);
      
      // 缓存命中处理
      if (summary) {
        if (typeof summary === 'string' && summary.length >= 10) {
          data[fieldName] = summary;
          log(2, `[缓存命中] ${data.title} 摘要已应用`);
          return data;
        }
        log(1, `缓存摘要无效，重新生成：${data.title}`);
      }

      // 文件路径构造（基于Hexo源目录）
      const path = this.source_dir + data.source;
      const fileContent = await fs.readFile(path, 'utf8');
      
      // 增强Front Matter解析
      const frontMatterMatch = fileContent.match(/^---\n([\s\S]+?)\n---/);
      if (!frontMatterMatch) {
        log(0, `Front Matter格式异常：${data.title}`);
        return data;
      }
      
      const frontMatterObj = yaml.load(frontMatterMatch[1]);
      const MdContent = fileContent.slice(frontMatterMatch[0].length).trim();

      // AI生成摘要
      summary = await ai(content, defaultPrompt, {
        model_type: config.model_type || 'openai',
        api: config.api,
        token: config.token,
        model: config.model,
        concurrency: config.concurrency,
        max_token: config.max_token
      });

      // 8.摘要有效性检查（长度、特殊字符）
      if (!summary || summary.length < 10 || /[\n#$%]/.test(summary)) {
        log(1, `文章 ${data.title} 的摘要内容不符合要求，跳过`);
        log(2, `文章 ${data.title} 的摘要内容为：${summary}`);
        return data;
      }

      // 更新缓存和Front Matter
      cache.set(content, config, summary);
      frontMatterObj[fieldName] = summary;
      
      // 获取文件物理路径
      const filePath = path.join(hexo.base_dir, 'source', data.source);
      if (!fs.existsSync(filePath)) {
        log(0, `文件不存在: ${filePath}`);
        return data;
      }
      
      // 处理异常Front Matter格式
      if (!frontMatterMatch) {
        log(0, `Front Matter格式异常: ${data.title}`);
        return data;
      }

      // 构建新内容
      const newFrontMatter = yaml.dump(frontMatterObj, { lineWidth: -1 });
      const newContent = fileContent.replace(/^---\n[\s\S]+?\n---/, `---\n${newFrontMatter}\n---`);
      
      // 10.原子写入文件（避免内容截断）
      await fs.writeFile(path, newContent, 'utf8');
      data[fieldName] = summary;
      log(1, `[成功] ${data.title} 摘要已写入`);

      return data;
    } catch (err) {
      // 异常捕获与日志记录（包含错误堆栈）
      log(0, `生成摘要失败：${data.title}`, err);
      return data;
    }
  });
});
