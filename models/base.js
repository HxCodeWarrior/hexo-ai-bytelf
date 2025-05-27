class BaseModelAdapter {
  constructor(config) {
    this.config = config;
  }

  async generateSummary(content, prompt) {
    throw new Error('Must implement generateSummary method');
  }

  _processResponse(summary) {
    return summary
      .replace(/[\r\n]+/g, ' ') // 去换行
      .replace(/\s+/g, ' ')      // 合并多空格
      .trim();
  }

  _validateSummary(summary) {
    const illegalChars = /[#`]/g;
    if (summary.length > 500) {
      console.info('[Hexo-AI-Byte-Elf] 摘要长度超过 500 字符限制');
    }
    if (summary.match(illegalChars)) {
      console.info('[Hexo-AI-Byte-Elf] 摘要包含非法字符');
    }
    return summary;
  }
}

module.exports = BaseModelAdapter;