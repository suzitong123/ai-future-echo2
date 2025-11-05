// api/generate-capsule/index.js - 修复版
const axios = require('axios');

module.exports = async (req, res) => {
  // 完整的 CORS 支持
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    console.log('处理 OPTIONS 预检请求');
    res.writeHead(200);
    res.end();
    return;
  }

  console.log('API called with method:', req.method);
  
  try {
    const { input } = req.body;
    
    // 从环境变量获取密钥 - 使用你的新密钥
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

    try {
      console.log('调用智谱AI API...');
      
      // 调用智谱AI API - 使用增强的提示词
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
4. 长度：500-800字，确保内容充实完整
5. 格式：要有完整的信件结构，包括称呼、正文、结尾
6. 细节：包含具体的场景描述和情感表达
7. 风格：温暖治愈，富有哲理但不说教

现在请开始写信：`
          }],
          temperature: 0.85,
          max_tokens: 2000,
          top_p: 0.9,
        },
        {
          headers: {
            'Authorization': `Bearer ${ZHIPU_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 45000
        }
      );

      const letter = response.data.choices[0].message.content;
      console.log('AI response received, length:', letter.length);

      // 检查内容长度
      if (letter.length < 100) {
        console.warn('AI返回内容过短:', letter.length);
      }

      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        letter: letter,
        status: 'success',
        timestamp: new Date().toISOString(),
        length: letter.length
      }));

    } catch (error) {
      console.error('AI API Error:', error.message);
      console.error('Error details:', error.response?.data || error.message);
      
      // 备用回复 - 更长的内容
      const fallbackLetters = [
        `亲爱的现在的我：\n\n我是五年后的你。在这个安静的午后，我坐在我们最喜欢的咖啡馆里，窗外阳光正好，突然想起了此刻正在思考的你。\n\n看到你写下"${input}"，我的心中涌起一股暖流。你知道吗？正是这些看似平常的思考时刻，在悄悄塑造着未来的轨迹。那些让你辗转反侧的夜晚，那些让你犹豫不决的抉择，都在不知不觉中让你变得更加坚韧和智慧。\n\n现在的你可能还看不到，但我想告诉你：每一个真诚的思考都是生命的种子，它们在时光的土壤里悄悄发芽，终将开出意想不到的花朵。不要着急，不要焦虑，相信时间的魔力，相信成长的力量。\n\n五年后的我，依然会为生活中的小确幸而感动，依然会为美好的事物驻足，但更多了一份从容和笃定。这份从容，正是来自于像你现在这样的思考和探索。\n\n继续勇敢地前行吧，保持心灵的开放，保持对世界的好奇。未来的路上会有惊喜，会有收获，也会有新的挑战，但你已经拥有了最宝贵的财富——一颗真诚而勇敢的心。\n\n永远相信你的未来，因为那就是我。\n\n—— 五年后的你`,

        `嗨，亲爱的现在的你！\n\n我是未来版本的你，特意穿越时空来给你写这封信。听说你正在思考"${input}"，这真是太棒了！\n\n你知道吗？在未来的某一天，你会突然明白，生命中最珍贵的不是某个具体的目标，而是这个不断探索、不断思考的过程。每一个问题，每一次困惑，都是灵魂在成长的证明。\n\n现在的你可能觉得前路模糊，但请相信，每一步都在引领你去往该去的地方。那些让你失眠的夜晚，那些让你心动的瞬间，那些让你成长的经历，都在编织着独一无二的人生画卷。\n\n五年后的我，依然记得此刻你的心情。我想告诉你：保持这份真诚，保持这份思考，它们会成为你未来最坚实的内核。不要害怕迷茫，因为迷茫中往往藏着最真实的自己。\n\n继续用开放的心态迎接每一天吧！生命会以你意想不到的方式展开它的美好。那些现在看似普通的日子，在未来回忆起来都会闪闪发光。\n\n记住，你比自己想象的更勇敢，更有力量。\n\n与你同行，\n未来的你`
      ];
      
      const randomLetter = fallbackLetters[Math.floor(Math.random() * fallbackLetters.length)];
      
      console.log('使用备用回复，长度:', randomLetter.length);
      
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        letter: randomLetter,
        status: 'success',
        mode: 'fallback',
        length: randomLetter.length
      }));
    }
  } catch (error) {
    console.error('Request processing error:', error);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      error: 'Request processing failed',
      details: error.message 
    }));
  }
};
