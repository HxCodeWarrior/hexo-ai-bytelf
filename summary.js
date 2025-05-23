/**
 * 摘要生成模块
 */
const axios = require('axios');
const { determineModelType } = require('./ai');
const { generateWithOpenAI } = require('./models/openai');
const { generateWithKimi } = require('./models/kimi');
const { generateWithHunyuan } = require('./models/hunyuan');

/**
 * 生成摘要
 * @param {string} token - API 密钥
 * @param {string} api - API 端点
 * @param {string} model - 使用的模型
 * @param {string} content - 文章内容
 * @param {string} title - 文章标题
 * @param {Object} config - 摘要配置
 * @returns {Promise<string>} 生成的摘要内容
 */
async function generateSummary(token, api, model, content, title, config = {}) {
  // 从配置中获取参数，如果没有则使用默认值
  const summaryConfig = config.summary || {};
  const temperature = summaryConfig.temperature || 0.7;
  const timeout = summaryConfig.timeout || config.timeout || 30000;
  const retries = summaryConfig.retries || config.retry || 3;
  
  // 使用配置中的 prompt 或默认 prompt
  const customPrompt = summaryConfig.prompt || '';
  const defaultPrompt = `
请根据以下文章内容，生成一个简洁的摘要。
摘要内容必须在150到250字之间，仅介绍文章核心内容。
请用中文作答，去除特殊字符。

文章标题：${title}

文章内容：
${content}
`;

  const prompt = customPrompt || defaultPrompt;
  
  // 确定使用哪个模型 API
  const modelType = determineModelType(model, api);
  
  // 发送请求并处理重试
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      let summary;
      
      // 根据模型类型调用不同的 API
      switch (modelType) {
        case 'kimi':
          summary = await generateWithKimi({
            token,
            model,
            prompt,
            temperature,
            timeout
          });
          break;
        case 'hunyuan':
          // 腾讯混元需要 secretId 和 secretKey
          const [secretId, secretKey] = token.split(':');
          summary = await generateWithHunyuan({
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
          summary = await generateWithOpenAI({
            token,
            api,
            model,
            prompt,
            temperature,
            timeout
          });
          break;
      }
      
      return summary.trim();
    } catch (error) {
      lastError = error;
      console.error(`[Hexo-AI-ByteElf] 摘要生成失败 (尝试 ${i+1}/${retries}): ${error.message}`);
      
      // 如果不是最后一次尝试，等待一段时间后重试
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
      }
    }
  }
  
  // 所有重试都失败
  throw lastError || new Error('生成摘要失败');
}

module.exports = generateSummary;