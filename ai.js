const ModelFactory = require('./models/factory');
const { processSummary, validateSummary } = require('./utils');

module.exports = async function ai(content, prompt, config) {
  const { model_type = 'openai' } = config;
  
  try {
    const mergedConfig = {
      ...config.params,             // 全局参数
      ...config.params[model_type], // 模型特有参数
      timeout: config.timeout,
      token: config.token,
      model: config.model,
      api: config.api
    };
    const model = ModelFactory.createModel(model_type, mergedConfig);
    const reply = await model.generateSummary(content, prompt);
    
    if (!reply) {
      throw new Error('AI 返回的响应为空');
    }

    const cleaned = processSummary(reply);
    return validateSummary(cleaned, config);
  } catch (error) {
    throw new Error(`AI 摘要生成失败: ${error.message}`);
  }
}
