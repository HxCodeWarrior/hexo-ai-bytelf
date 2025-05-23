/**
 * Kimi API 封装模块
 * 基于 OpenAI 兼容接口
 */
const OpenAI = require('openai');
const axios = require('axios');

/**
 * 创建 Kimi API 客户端
 * @param {Object} config - 配置对象
 * @returns {Object} - Kimi API 客户端
 */
function createKimiClient(config) {
  const { token, timeout = 30000 } = config;
  
  // 创建 OpenAI 兼容客户端
  const client = new OpenAI({
    apiKey: token, // Moonshot API Key
    baseURL: "https://api.moonshot.cn/v1",
    timeout: timeout
  });
  
  return client;
}

/**
 * 使用 Kimi 生成内容
 * @param {Object} params - 请求参数
 * @param {string} params.token - API 密钥
 * @param {string} params.model - 模型名称，如 "moonshot-v1-8k"
 * @param {string} params.prompt - 提示词
 * @param {string} params.systemPrompt - 系统提示词
 * @param {number} params.temperature - 温度参数
 * @param {number} params.timeout - 超时时间
 * @returns {Promise<string>} - 生成的内容
 */
async function generateWithKimi(params) {
  const { 
    token, 
    model = "moonshot-v1-8k", 
    prompt, 
    systemPrompt = "你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。", 
    temperature = 0.7,
    timeout = 30000
  } = params;
  
  try {
    // 创建客户端
    const client = createKimiClient({ token, timeout });
    
    // 发送请求
    const completion = await client.chat.completions.create({
      model: model,
      messages: [
        { "role": "system", "content": systemPrompt },
        { "role": "user", "content": prompt }
      ],
      temperature: temperature,
    });
    
    // 返回生成的内容
    return completion.choices[0].message.content;
  } catch (error) {
    console.error(`[Hexo-AI-ByteElf] Kimi API 请求失败: ${error.message}`);
    throw error;
  }
}

module.exports = {
  generateWithKimi,
  createKimiClient
};