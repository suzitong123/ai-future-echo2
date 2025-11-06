// api/generate-capsule/index.js - 修复版
const axios = require('axios');

module.exports = async (req, res) => {
  console.log('API called with method:', req.method);
  
  try {
    const { input } = req.body;
    
    // 从环境变量获取密钥
    const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY;
    
    console.log('Received input:', input ? input.substring(0, 50) + '...' : 'empty');
    console.log('API Key available:', !!ZHIPU_API_KEY);
    
    if (!input) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        letter: '请先输入一些内容，分享你此刻的想法吧！',
        status: 'error'
      }));
    }

    // 如果没有配置 API Key，使用备用回复
    if (!ZHIPU_API_KEY) {
      console.log('No API key, using fallback');
      const fallbackLetters = [
        `亲爱的现在的我，\n\n我是5年后的你。看到你此刻的分享："${input}"，我想告诉你，生命中的每一个阶段都有其独特的意义。\n\n那些让你思考的时刻，那些让你成长的经历，都在悄悄塑造着更美好的你。相信时间的魔力，保持心灵的开放，未来会以你意想不到的方式展开。\n\n—— 永远相信你的未来我`,

        `嗨！现在的你，\n\n我是未来版本的你！听说你正在思考"${input}"，这真是太棒了！\n\n每一个真诚的思考都是通向更好未来的钥匙。想象一下，3年后的你在回头看时，会深深感激现在这个勇敢探索的自己。\n\n✨ 与你同行的未来我`
      ];
      
      const randomLetter = fallbackLetters[Math.floor(Math.random() * fallbackLetters.length)];
      
      res.writeHead(200, { 
        'Content-Type': 'application/json'
      });
      return res.end(JSON.stringify({
        letter: randomLetter,
        status: 'success',
        mode: 'fallback'
      }));
    }

    try {
      // 调用智谱AI API
      console.log('Calling ZhiPu AI API...');
      const response = await axios.post(
        'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        {
          model: "glm-4",
          messages: [{
            role: "user",
            content: `请你扮演5年后的用户本人，基于用户当前的状态和心情，给现在的他/她写一封温暖、鼓励的完整信件。

用户当前的想法是："${input}"

写作要求：
1. 身份：你是【5年后的用户】，用第一人称"我"来写
2. 口吻：亲切、真诚、充满希望，像朋友间的私密信件  
3. 内容：回应当前情绪，分享积极变化，给予温暖祝福
4. 长度：250-350字，自然流畅

现在请开始写信：`
          }],
          temperature: 0.8,
          max_tokens: 800
        },
        {
          headers: {
            'Authorization': `Bearer ${ZHIPU_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const letter = response.data.choices[0].message.content;
      console.log('AI response received, length:', letter.length);

      res.writeHead(200, { 
        'Content-Type': 'application/json'
      });
      res.end(JSON.stringify({
        letter: letter,
        status: 'success',
        timestamp: new Date().toISOString()
      }));

    } catch (error) {
      console.error('AI API Error:', error.message);
      
      // 备用回复
      const fallbackLetters = [
        `亲爱的现在的我，\n\n我是5年后的你。看到你此刻的分享，我想告诉你，生命中的每一个阶段都有其独特的意义。\n\n那些让你思考的时刻，那些让你成长的经历，都在悄悄塑造着更美好的你。相信时间的魔力，保持心灵的开放，未来会以你意想不到的方式展开。\n\n—— 永远相信你的未来我`,

        `嗨！现在的你，\n\n我是未来版本的你！听说你正在思考，这真是太棒了！\n\n每一个真诚的思考都是通向更好未来的钥匙。想象一下，3年后的你在回头看时，会深深感激现在这个勇敢探索的自己。\n\n✨ 与你同行的未来我`
      ];
      
      const randomLetter = fallbackLetters[Math.floor(Math.random() * fallbackLetters.length)];
      
      res.writeHead(200, { 
        'Content-Type': 'application/json'
      });
      res.end(JSON.stringify({
        letter: randomLetter,
        status: 'success',
        mode: 'fallback'
      }));
    }
  } catch (error) {
    console.error('Request processing error:', error);
    res.writeHead(500, { 
      'Content-Type': 'application/json'
    });
    res.end(JSON.stringify({ 
      error: 'Request processing failed',
      details: error.message,
      status: 'error'
    }));
  }
};
