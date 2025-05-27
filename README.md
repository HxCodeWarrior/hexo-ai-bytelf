# hexo-ai-bytelf

[![NPM Version](https://img.shields.io/npm/v/hexo-ai-bytelf.svg)](https://www.npmjs.com/package/hexo-ai-bytelf)
[![License](https://img.shields.io/npm/l/hexo-ai-bytelf.svg)](./LICENSE)

> 一个强大的 Hexo 插件，使用 AI 自动为博文生成高质量摘要。支持多种主流 AI 模型，包括 OpenAI、腾讯混元、讯飞星火、Kimi 等。

[📦 NPM包地址](https://www.npmjs.com/package/hexo-ai-bytelf) | [🌐 示例站点](https://blog.devnest.top/)

## ⚠️ 重要提示

- 本插件仅在 Hexo 生成阶段对 Markdown 文件进行处理，不包含任何前端功能或渲染组件
- **AI 生成具有随机性，可能会造成文章内容紊乱，请在生成前备份文章，生成后及时检查摘要内容**
- 首次使用时建议先用单篇文章测试，确认效果后再批量处理

## ✨ 特性

- 🤖 **多模型支持**：兼容主流 AI 模型接口
  - OpenAI (ChatGPT)
  - Kimi
  - 腾讯混元
  - 讯飞星火
  - 阿里千问
- 🎯 **智能生成**：自动提取文章核心内容，生成高质量摘要
- 🔄 **增量更新**：可选是否覆盖已有摘要，避免重复生成
- 🧹 **智能清洗**：自动过滤 Markdown 标记、代码块等干扰内容
- ⚡ **并发处理**：支持多篇文章并发请求，提升处理效率
- 💾 **本地缓存**：缓存生成结果，避免重复调用 API
- 📝 **分级日志**：支持三级日志输出，方便调试问题

## 🚀 快速开始

### 1、安装

```bash
npm install hexo-ai-bytelf --save
```

---

## 2、⚙ 配置项（添加到 `_config.yml` 或主题配置文件中）

### 2.1、基础配置

```yaml
byte_ai_summary:
  # 基本控制
  enable: true                  # 是否启用插件
  cover_all: false              # 是否覆盖已有摘要
  cache: true                   # 是否启用缓存
  filed: description            #
  summary_field: summary        # 摘要字段名称
  logger: 1                     # 日志等级（0=仅错误，1=生成+错误，2=全部）

  title: ByteWyrmのAI摘要
  loadingText: ByteWyrm AI正在绞尽脑汁想思路ING···

  # AI 接口配置（以 OpenAI 为例）
  ai_model:
    model_type: openai  # 可选值：openai, tencent, xunfei, kimi, qwq
    api: https://api.openai.com/v1/chat/completions  # 根据 model_type 填写对应的 API 地址
    token: your-api-token  # API 密钥
    model: gpt-3.5-turbo  # 模型名称
```

### 2.2、高级配置

```yaml
byte_ai_summary:
  # 性能配置
  timeout: 30000             # API 请求超时时间（毫秒）
  maxRetries: 3              # 失败重试次数
  max_token: 5000            # 输入内容最大 token 长度
  concurrency: 2             # 并发处理数量

  # 缓存配置
  cacheDir: .byte_ai_summary_cache   # 缓存目录
  cacheExpire: 604800000             # 缓存过期时间（毫秒，默认7天）

  # 内容处理配置
  ignoreRules:               # 自定义内容清洗规则（正则表达式）
    - "\\{%.*?%\\}"          # 忽略 Hexo 标签
    - "!\\[.*?\\]\\(.*?\\)"  # 忽略图片
    - "^\\s*```[\\s\\S]*?```\\s*$" # 忽略代码块

  # 摘要格式控制
  minLength: 10              # 摘要最小长度
  maxLength: 500             # 摘要最大长度
  illegalChars: "[#$%`]"     # 非法字符正则
```


## 3、支持的AI模型API接口

| 模型 | API 接口 | 说明 |
|-----|---------|------|
| OpenAI | https://api.openai.com/v1/chat/completions | ChatGPT API |
| 腾讯混元 | https://api.hunyuan.cloud.tencent.com/v1/chat/completions | 腾讯AI平台 |
| 讯飞星火 | https://spark-api-open.xf-yun.com/v1/chat/completions | 讯飞开放平台 |
| Kimi | https://api.moonshot.cn/v1/chat/completions | Moonshot AI |
| 阿里千问 | https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions | 阿里云平台 |

---

### 4、📋 日志等级说明

| 值   | 日志级别说明                        |
| --- | ----------------------------- |
| `0` | 仅输出错误信息                       |
| `1` | 输出生成摘要和错误信息（默认推荐）             |
| `2` | 输出所有调试信息（包括跳过的页面、原始长度、清洗后长度等） |

---

## 5、🧹 默认处理规则包括：

* 删除 HTML 标签、空格实体、空行、换行
* 删除 Markdown 的图片、链接、代码块（含多行）
* 可通过 `ignoreRules` 增加自定义正则清洗

---

## 6、📁 插件文件结构

* `\models\`: 模型api处理
* `index.js`: 主逻辑文件，挂载在 Hexo 的 `before_post_render` 阶段
* `ai.js`: 封装请求 OpenAI 或其他 AI 模型接口
* `strip.js`: 清洗 Markdown 正文中的冗余信息
* `cache.js`: API请求结果缓存处理
* `utils.js`: 其他辅助函数
* `package.json`: 插件依赖声明

---

## 7、🧩 所需依赖

插件运行依赖以下 NPM 包：

```bash
npm install axios p-limit hexo-front-matter
```
大部分为`hexo`自带包，所以基本无需安装，可以尝试直接使用。

---

## 8、📝 使用示例

### 文章 Markdown 示例：

```markdown
---
title: 如何使用 hexo-ai-bytelf
date: 2025-05-27
categories: 教程
tags:
  - hexo
  - blog
summary: "" # 插件会自动填充
---

本文将介绍如何使用 Hexo 搭建个人博客,并使用hexo-ai-bytelf...
```

### 生成后的 Markdown：

```markdown
---
title: 如何使用 hexo-ai-bytelf
summary: 这里是ByteWyrm AI，本文详细介绍了使用 Hexo 框架搭建个人博客的完整流程，包括环境配置、主题选择、插件安装等关键步骤...
---
```

---

## 📜 License

[MIT](./LICENSE)

---

如需进一步定制 prompt 或支持其他 AI 接口，欢迎提 issue 或提交 PR！