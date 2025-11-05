// api/generate-capsule/index.js - 简化版（服务器已解析body）
const axios = require('axios');

module.exports = async (req, res) => {
  console.log('🎯 API 处理器被调用');
  
  try {
    // 直接从 req.body 获取数据（服务器已经解析好了）
    const { input } = req.body;
    
    console.log('📝 接收到的输入:', input);
    console.log('🔑 API密钥状态:', process.env.ZHIPU_API_KEY ? '已设置' : '未设置');

    if (!input) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        letter: '请先输入一些内容，分享你此刻的想法吧！',
        status: 'error'
      }));
    }

    // 测试模式：先返回成功响应
    const testResponse = {
      letter: `🎉 后端连接成功！\n\n你的输入是："${input}"\n\n环境变量状态：${process.env.ZHIPU_API_KEY ? '✅ 已设置' : '❌ 未设置'}\n\n这是测试回复，确认API工作正常。`,
      status: 'success',
      mode: 'test',
      timestamp: new Date().toISOString()
    };

    console.log('📤 发送测试响应');
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(testResponse));

  } catch (error) {
    console.error('❌ API 处理器错误:', error);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      error: 'API processing failed',
      details: error.message 
    }));
  }
};
