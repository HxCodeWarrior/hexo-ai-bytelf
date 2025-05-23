/**
 * 腾讯混元 API 封装模块
 */
const axios = require('axios');
const crypto = require('crypto');

/**
 * 生成腾讯云 API 签名
 * @param {Object} options - 签名选项
 * @returns {Object} - 包含签名的请求头
 */
function generateTencentSignature(options) {
  const { secretId, secretKey, service = 'hunyuan', region = 'ap-guangzhou' } = options;
  
  if (!secretId || !secretKey) {
    throw new Error('secretId 和 secretKey 是必需的');
  }
  
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().split('T')[0];
  
  // 规范请求串
  const httpRequestMethod = 'POST';
  const canonicalUri = '/';
  const canonicalQueryString = '';
  const canonicalHeaders = 'content-type:application/json\nhost:hunyuan.tencentcloudapi.com\n';
  const signedHeaders = 'content-type;host';
  
  // 步骤1：拼接规范请求串
  const hashedRequestPayload = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'; // 空请求体的哈希
  const canonicalRequest = `${httpRequestMethod}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${hashedRequestPayload}`;
  
  // 步骤2：拼接待签名字符串
  const algorithm = 'TC3-HMAC-SHA256';
  const credentialScope = `${date}/${service}/tc3_request`;
  const hashedCanonicalRequest = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
  const stringToSign = `${algorithm}\n${timestamp}\n${credentialScope}\n${hashedCanonicalRequest}`;
  
  // 步骤3：计算签名
  const secretDate = crypto.createHmac('sha256', `TC3${secretKey}`).update(date).digest();
  const secretService = crypto.createHmac('sha256', secretDate).update(service).digest();
  const secretSigning = crypto.createHmac('sha256', secretService).update('tc3_request').digest();
  const signature = crypto.createHmac('sha256', secretSigning).update(stringToSign).digest('hex');
  
  // 步骤4：拼接 Authorization
  const authorization = `${algorithm} Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  return {
    Authorization: authorization,
    'Content-Type': 'application/json',
    'X-TC-Action': 'ChatCompletions',
    'X-TC-Timestamp': timestamp.toString(),
    'X-TC-Version': '2023-11-10',
    'X-TC-Region': region
  };
}

/**
 * 使用腾讯混元生成内容
 * @param {Object} params - 请求参数
 * @param {string} params.secretId - 腾讯云 SecretId
 * @param {string} params.secretKey - 腾讯云 SecretKey
 * @param {string} params.prompt - 提示词
 * @param {string} params.model - 模型名称，默认为 "hunyuan-turbo"
 * @param {number} params.temperature - 温度参数
 * @param {number} params.timeout - 超时时间
 * @returns {Promise<string>} - 生成的内容
 */
async function generateWithHunyuan(params) {
  const { 
    secretId, 
    secretKey, 
    prompt, 
    model = "hunyuan-turbo", 
    temperature = 0.7,
    timeout = 30000
  } = params;
  
  try {
    // 生成请求头
    const headers = generateTencentSignature({
      secretId,
      secretKey,
      service: 'hunyuan'
    });
    
    // 构建请求数据
    const requestData = {
      TopP: 1,
      Temperature: temperature,
      Model: model,
      Stream: false,
      Messages: [
        {
          Role: "user",
          Content: prompt
        }
      ]
    };
    
    // 发送请求
    const response = await axios.post(
      'https://hunyuan.tencentcloudapi.com',
      requestData,
      {
        headers,
        timeout
      }
    );
    
    // 解析响应
    if (response.data && response.data.Response && response.data.Response.Choice) {
      return response.data.Response.Choice.Content;
    } else {
      throw new Error('腾讯混元 API 返回格式不正确');
    }
  } catch (error) {
    console.error(`[Hexo-AI-ByteElf] 腾讯混元 API 请求失败: ${error.message}`);
    throw error;
  }
}

module.exports = {
  generateWithHunyuan
};