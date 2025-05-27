const OpenAIAdapter = require('./openai');
const TencentAdapter = require('./tencent');
const XunfeiAdapter = require('./xunfei');
const KimiAdapter = require('./kimi');
const QWQAdapter = require('./qwq');

class ModelFactory {
  static createModel(type, config) {
    switch (type.toLowerCase()) {
      case 'openai':
        return new OpenAIAdapter(config);
      case 'tencent':
        return new TencentAdapter(config);
      case 'xunfei':
        return new XunfeiAdapter(config);
      case 'kimi':
        return new KimiAdapter(config);
      case 'qwq':
        return new QWQAdapter(config);
      default:
        throw new Error(`不支持的模型类型: ${type}`);
    }
  }
}

module.exports = ModelFactory;