const fs = require('hexo-fs');
const path = require('path');
const crypto = require('crypto');
const { log } = require('./utils');

class SummaryCache {
  constructor(cacheDir) {
    this.cacheDir = cacheDir || '.summary-cache';
    this.cacheFile = path.join(this.cacheDir, 'cache.json');
    this.cache = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.cacheFile)) {
        return JSON.parse(fs.readFileSync(this.cacheFile));
      }
    } catch (err) {
      log(1, '加载缓存失败', err);
    }
    return {};
  }

  save() {
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
      fs.writeFileSync(this.cacheFile, JSON.stringify(this.cache, null, 2));
    } catch (err) {
      log(1, '保存缓存失败', err);
    }
  }

  generateKey(content, config) {
    const hash = crypto.createHash('md5');
    hash.update(content);
    hash.update(JSON.stringify({
      model: config.model,
      prompt: config.prompt,
      max_token: config.max_token
    }));
    return hash.digest('hex');
  }

  get(content, config) {
    const key = this.generateKey(content, config);
    const cached = this.cache[key];
    
    if (cached) {
      const age = Date.now() - cached.timestamp;
      // 缓存有效期7天
      if (age < 7 * 24 * 60 * 60 * 1000) {
        log(2, '使用缓存的摘要');
        return cached.summary;
      }
      delete this.cache[key];
      this.save();
    }
    return null;
  }

  set(content, config, summary) {
    const key = this.generateKey(content, config);
    this.cache[key] = {
      summary,
      timestamp: Date.now()
    };
    this.save();
  }

  clear() {
    this.cache = {};
    this.save();
    log(1, '清除缓存完成');
  }
}

module.exports = SummaryCache;