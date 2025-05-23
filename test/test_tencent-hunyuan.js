const axios = require('axios');

async function testHunyuanAPI() {
  try {
    const apiKey = 'sk-LpB5qB2bNYoulAYvWiseM8JmPlIsqadduei7yR462AaQvIv2'; // 替换为你的混元 API Key
    const apiUrl = 'https://api.hunyuan.cloud.tencent.com/v1/chat/completions';

    // 模拟中文博客文章内容
    const blogContent = {
        title: "如何高效学习编程",
        sections: [
            "## 第一部分 制定学习计划",
            "学习编程需要系统性的规划...",
            "## 第二部分 实践项目",
            "通过实际项目来巩固知识...",
            "## 第三部分 持续学习",
            "技术更新迭代快，需要保持学习..."
        ].join("\n")
    };

    const response = await axios.post(
      apiUrl,
      {
        model: 'hunyuan-turbos-latest', // 使用混元模型
        messages: [
          {
            role: 'user',
            content:  `请为以下博客文章生成摘要:\n标题:${blogContent.title}\n内容:\n${blogContent.sections}`
          }
        ],
        enable_enhancement: true, // 启用增强功能（混元自定义参数）
        temperature: 0.7 // 采样温度，控制生成的随机性
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 设置超时时间 30 秒
      }
    );

    // 输出完整响应
    console.log('完整响应:', JSON.stringify(response.data, null, 2));

    // 输出 message 内容
    if (response.data.choices && response.data.choices[0].message) {
      console.log('\nMessage 内容:', response.data.choices[0].message.content);
    }

  } catch (error) {
    console.error('API 调用失败:', error.response?.data || error.message);
    // 如果是网络问题导致解析失败，给出提示
    if (error.code === 'ERR_NETWORK' || error.code === 'ENOTFOUND') {
      console.warn('\n网络连接失败，可能的原因：');
      console.warn('- API 地址可能不正确，请检查 https://api.hunyuan.cloud.tencent.com/v1 是否可用');
      console.warn('- 网络可能存在限制，建议检查网络设置或使用代理');
      console.warn('- API 服务可能暂时不可用，建议稍后重试');
    }
  }
}

testHunyuanAPI();