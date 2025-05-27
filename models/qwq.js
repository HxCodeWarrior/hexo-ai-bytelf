const fetch = require('node-fetch');
const BaseModelAdapter = require('./base');

class QWQAdapter extends BaseModelAdapter {
  async generateSummary(content, prompt) {
    const url = this.config.api || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.token}`
    };

    const body = {
      model: this.config.model || 'qwen-plus',
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
      seed: this.config.seed
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`QWQ 请求失败 (${res.status}): ${errText}`);
      }

      const json = await res.json();
      const reply = json.choices?.[0]?.message?.content?.trim();
      
      if (!reply) {
        throw new Error('QWQ 返回的响应格式不正确');
      }

      const processed = this._processResponse(reply);
      return this._validateSummary(processed);
    } catch (error) {
      throw new Error(`QWQ 请求失败: ${error.message}`);
    }
  }
}

module.exports = QWQAdapter;