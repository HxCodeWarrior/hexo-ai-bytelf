/**
 * AI 模型集成模块
 * 支持 OpenAI、Kimi、腾讯混元等多种模型
 */
const { generateWithOpenAI } = require('./models/openai');
const { generateWithKimi } = require('./models/kimi');
const { generateWithHunyuan } = require('./models/hunyuan');
const generateSummary = require('./summary');
const generateMindmap = require('./mindmap');

/**
 * 确定模型类型
 * @param {string} model - 模型名称
 * @param {string} api - API 端点
 * @returns {string} - 模型类型：'openai', 'kimi', 'hunyuan'
 */
function determineModelType(model, api) {
  // 根据模型名称或 API 端点确定模型类型
  if (model.startsWith('moonshot') || api.includes('moonshot.cn') || api.includes('kimi')) {
    return 'kimi';
  } else if (model.startsWith('hunyuan') || api.includes('hunyuan') || api.includes('tencent')) {
    return 'hunyuan';
  } else {
    return 'openai';
  }
}

/**
 * 获取思维导图生成的提示词
 * @param {string} title - 文章标题
 * @param {string} content - 文章内容
 * @param {Object} config - 思维导图配置
 * @returns {string} - 提示词
 */
function getMindmapPrompt(title, content, config = {}) {
  const maxBranches = config.max_branches || 5;
  const maxDepth = config.max_depth || 3;
  
  // 使用配置中的 prompt 或默认 prompt
  const customPrompt = config.prompt || '';
  const defaultPrompt = `
请根据以下文章内容，生成一个结构清晰的思维导图。
思维导图应该包含主题（文章标题）和至少3-${maxBranches}个主要分支，每个分支可以有子分支。
格式要求：
1. 使用Markdown格式
2. 主题放在第一级
3. 使用"-"表示每一级
4. 最多不超过${maxDepth}层嵌套
5. 不要添加任何额外说明

文章标题：${title}

文章内容：
${content}
`;

  return customPrompt || defaultPrompt;
}

/**
 * 生成思维导图
 * @param {string} token - API 密钥
 * @param {string} api - API 端点
 * @param {string} model - 模型名称
 * @param {string} content - 文章内容
 * @param {string} title - 文章标题
 * @param {Object} config - 配置对象
 * @returns {Promise<string>} - 生成的思维导图
 */
async function generateAIMindmap(token, api, model, content, title, config = {}) {
  // 从配置中获取参数，如果没有则使用默认值
  const mindmapConfig = config.mindmap || {};
  const temperature = mindmapConfig.temperature || 0.5;
  const timeout = mindmapConfig.timeout || config.timeout || 30000;
  const retries = mindmapConfig.retries || config.retry || 3;
  
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
            prompt: getMindmapPrompt(title, content, mindmapConfig),
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
            prompt: getMindmapPrompt(title, content, mindmapConfig),
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
            prompt: getMindmapPrompt(title, content, mindmapConfig),
            temperature,
            timeout,
            systemPrompt: '你是一个专业的思维导图生成工具，能够根据文章内容生成结构清晰的思维导图。'
          });
          break;
      }
      
      return mindmap.trim();
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

/**
 * 统一的 AI 生成接口
 * @param {string} token - API 密钥
 * @param {string} api - API 端点
 * @param {string} model - 模型名称
 * @param {string} content - 文章内容
 * @param {string} prompt - 提示词
 * @param {number} temperature - 温度参数
 * @param {number} timeout - 超时时间
 * @param {number} retries - 重试次数
 * @returns {Promise<string>} - 生成的内容
 */
async function ai(token, api, model, content, prompt, temperature = 0.7, timeout = 30000, retries = 3) {
  // 确定使用哪个模型 API
  const modelType = determineModelType(model, api);
  
  // 发送请求并处理重试
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      let result;
      
      // 根据模型类型调用不同的 API
      switch (modelType) {
        case 'kimi':
          result = await generateWithKimi({
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
          result = await generateWithHunyuan({
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
          result = await generateWithOpenAI({
            token,
            api,
            model,
            prompt,
            temperature,
            timeout
          });
          break;
      }
      
      return result.trim();
    } catch (error) {
      lastError = error;
      console.error(`[Hexo-AI-ByteElf] AI 生成失败 (尝试 ${i+1}/${retries}): ${error.message}`);
      
      // 如果不是最后一次尝试，等待一段时间后重试
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
      }
    }
  }
  
  // 所有重试都失败
  throw lastError || new Error('AI 生成失败');
}

module.exports = {
  ai,
  generateSummary,
  generateAIMindmap,
  determineModelType,
  getMindmapPrompt
};
