const axios = require('axios');

async function testAPI() {
  try {
    const response = await axios.post(
      'https://api.moonshot.cn/v1/chat/completions',
      {
        model: 'moonshot-v1-8k',
        messages: [{ 
          role: 'user', 
          content: '测试 这是一篇测试文章，用于测试 hexo-ai-bytelf 插件的功能。## 第一部分 这里是第一部分的内容...## 第二部分 这里是第二部分的内容...' 
        }],
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer sk-OoYm2k6NVpTalyOItC7dKFrm1U9gZC5WbfiVKsl9jCOtXwUg`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    // 完整输出响应数据
    console.log('完整响应:', JSON.stringify(response.data, null, 2));
    
    // 单独输出message内容
    if(response.data.choices && response.data.choices[0].message) {
      console.log('\nMessage内容:', response.data.choices[0].message.content);
    }
    
  } catch (error) {
    console.error('API 调用失败:', error.response?.data || error.message);
  }
}

testAPI();