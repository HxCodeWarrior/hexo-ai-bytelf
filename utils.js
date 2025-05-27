const LOG_LEVELS = {
    SILENT: 0,   // 只输出错误
    NORMAL: 1,   // 输出错误和需要生成摘要的文章
    VERBOSE: 2   // 输出所有信息，包括跳过的文章
  };
  
  function log(level, message, error = null) {
    const prefix = '[Hexo-AI-Byte-Elf]';
    if (level >= (global.hexo?.config?.byte_ai_summary?.logger ?? LOG_LEVELS.NORMAL)) {
      if (error) {
        console.error(`${prefix} ${message}`, error);
      } else {
        console.info(`${prefix} ${message}`);
      }
    }
  }
  
  function validateConfig(config) {
    const errors = [];
    
    // 必需配置
    if (!config.model_type) errors.push('缺少 model_type 配置');
    if (!config.api) errors.push('缺少 API 配置');
    if (!config.token) errors.push('缺少 Token 配置');
    if (!config.model) errors.push('缺少 model 配置');
    
    // model_type 验证
    const validModelTypes = ['openai', 'tencent', 'xunfei', 'kimi', 'qwq'];
    if (!validModelTypes.includes(config.model_type)) {
      errors.push(`model_type 配置无效，必须是以下之一: ${validModelTypes.join(', ')}`);
    }
    
    // 数值类型配置
    const numberConfigs = ['concurrency', 'timeout', 'maxRetries', 'max_token'];
    numberConfigs.forEach(key => {
      if (config[key] && (typeof config[key] !== 'number' || config[key] < 1)) {
        errors.push(`${key} 配置无效`);
      }
    });
    
    // 数组类型配置
    if (config.ignoreRules && !Array.isArray(config.ignoreRules)) {
      errors.push('ignoreRules 配置必须是数组');
    }
    
    return errors;
  }
  
  function processSummary(summary) {
    return summary
      .replace(/[\r\n]+/g, ' ') // 去换行
      .replace(/\s+/g, ' ')      // 合并多空格
      .trim();
  }
  
  function validateSummary(summary, config = {}) {
    const maxLength = config.maxLength || 500;
    const illegalChars = new RegExp(config.illegalChars || '[#`]', 'g');
    
    if (summary.length > maxLength) {
      log(1, `AI 返回摘要不符合格式要求（长度超过 ${maxLength} 字符限制）`);
    }
  
    if (summary.match(illegalChars)) {
      log(1, `AI 返回摘要不符合格式要求（包含非法字符）`);
    }
  
    return summary;
  }
  
  module.exports = {
    LOG_LEVELS,
    log,
    validateConfig,
    processSummary,
    validateSummary
  };