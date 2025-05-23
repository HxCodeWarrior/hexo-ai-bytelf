/**
 * OpenAI API 封装模块
 */
const { Configuration, OpenAIApi } = require('openai');
const axios = require('axios');

/**
 * 使用 OpenAI 生成内容
 * @param {Object} params - 请求参数
 * @param {string} params.token - API 密钥
 * @param {string} params.api - API 端点
 * @param {string} params.model - 模型名称
 * @param {string} params.prompt - 提示词
 * @param {string} params.systemPrompt - 系统提示词
 * @param {number} params.temperature - 温度参数
 * @param {number} params.timeout - 超时时间
 * @returns {Promise<string>} - 生成的内容
 */
async function generateWithOpenAI(params) {
  const { 
    token, 
    api = "https://api.openai.com/v1/chat/completions", 
    model = "gpt-3.5-turbo", 
    prompt, 
    systemPrompt = "你是一个有用的AI助手。", 
    temperature = 0.7,
    timeout = 30000
  } = params;
  
  try {
    // 创建请求配置
    const requestConfig = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      timeout: timeout
    };
    
    // 创建请求数据
    const data = {
      model: model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: temperature
    };
    
    // 发送请求
    const response = await axios.post(api, data, requestConfig);
    
    // 解析响应
    if (response.data && response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('OpenAI API 返回格式不正确');
    }
  } catch (error) {
    console.error(`[Hexo-AI-ByteElf] OpenAI API 请求失败: ${error.message}`);
    throw error;
  }
}

module.exports = {
  generateWithOpenAI
};