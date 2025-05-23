/**
 * 思维导图生成模块
 */
const axios = require('axios');
const { determineModelType, getMindmapPrompt } = require('./ai');
const { generateWithOpenAI } = require('./models/openai');
const { generateWithKimi } = require('./models/kimi');
const { generateWithHunyuan } = require('./models/hunyuan');

/**
 * 生成思维导图
 * @param {string} token - API 密钥
 * @param {string} api - API 端点
 * @param {string} model - 使用的模型
 * @param {string} content - 文章内容
 * @param {string} title - 文章标题
 * @param {Object} config - 思维导图配置
 * @returns {Promise<string>} 生成的思维导图内容
 */
async function generateMindmap(token, api, model, content, title, config = {}) {
  // 从配置中获取参数，如果没有则使用默认值
  const mindmapConfig = config.mindmap || {};
  const temperature = mindmapConfig.temperature || 0.5;
  const timeout = mindmapConfig.timeout || 30000;
  const retries = mindmapConfig.retries || config.retry || 3;
  const format = mindmapConfig.format || 'markdown';
  
  // 获取思维导图提示词
  const prompt = getMindmapPrompt(title, content, mindmapConfig);
  
  // 确定使用哪个模型 API
  const modelType = determineModelType(model, api);

  // 发送请求并处理重试
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      let mindmap;
      
      // 根据模型类型调用不同的 API
      switch (modelType) {
        case 'kimi':
          mindmap = await generateWithKimi({
            token,
            model,
            prompt,
            temperature,
            timeout,
            systemPrompt: '你是一个专业的思维导图生成工具，能够根据文章内容生成结构清晰的思维导图。'
          });
          break;
        case 'hunyuan':
          // 腾讯混元需要 secretId 和 secretKey
          const [secretId, secretKey] = token.split(':');
          mindmap = await generateWithHunyuan({
            secretId,
            secretKey,
            prompt,
            model,
            temperature,
            timeout
          });
          break;
        case 'openai':
        default:
          mindmap = await generateWithOpenAI({
            token,
            api,
            model,
            prompt,
            temperature,
            timeout,
            systemPrompt: '你是一个专业的思维导图生成工具，能够根据文章内容生成结构清晰的思维导图。'
          });
          break;
      }
      
      let mindmapContent = mindmap.trim();
      
      // 格式化为 Hexo 思维导图标签
      if (format === 'markdown') {
        mindmapContent = `{% pullquote mindmap mindmap-md %}\n${mindmapContent}\n{% endpullquote %}`;
      }
      
      return mindmapContent;
    } catch (error) {
      lastError = error;
      console.error(`[Hexo-AI-ByteElf] 思维导图生成失败 (尝试 ${i+1}/${retries}): ${error.message}`);
      
      // 如果不是最后一次尝试，等待一段时间后重试
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
      }
    }
  }

  // 所有重试都失败
  throw lastError || new Error('生成思维导图失败');
}

module.exports = generateMindmap;