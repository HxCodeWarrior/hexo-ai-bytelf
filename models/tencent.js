const OpenAI = require('openai');
const BaseModelAdapter = require('./base');

class TencentAdapter extends BaseModelAdapter {
  constructor(config) {
    super(config);
    this.client = new OpenAI({
      apiKey: process.env['HUNYUAN_API_KEY'] || this.config.token,
      baseURL: this.config.api || 'https://api.hunyuan.cloud.tencent.com/v1'
    });
  }

  async generateSummary(content, prompt) {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.config.model || 'hunyuan-turbos-latest',
        messages: [
          {
            role: 'system',
            content: "所有摘要内容均不要换行，不要分段，不要分点，写在一段文本内即可！" + prompt
          },
          {
            role: 'user',
            content
          }
        ],
        temperature: this.config.temperature,
        top_p: this.config.top_p,
        max_tokens: this.config.max_tokens,
        enable_enhancement: this.config.enable_enhancement || true
      });

      const reply = completion.choices[0]?.message?.content?.trim();
      
      if (!reply) {
        throw new Error('腾讯混元返回的响应格式不正确');
      }

      const processed = this._processResponse(reply);
      return this._validateSummary(processed);
    } catch (error) {
      throw new Error(`腾讯混元请求失败: ${error.message}`);
    }
  }
}

module.exports = TencentAdapter;