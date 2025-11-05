// index.js - 修正版
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;

console.log('🚀 启动服务器...');

const server = http.createServer(async (req, res) => {
  console.log(`📨 收到请求: ${req.method} ${req.url}`);
  
  // CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 预检请求
  if (req.method === 'OPTIONS') {
    console.log('🔄 处理 OPTIONS 预检请求');
    res.writeHead(200);
    return res.end();
  }

  // API 路由 - 修正拼写
  if (req.url === '/api/generate-capsule' && req.method === 'POST') {
    console.log('🎯 处理 API 请求');
    try {
      const handler = require('./api/generate-capsule/index.js');
      return handler(req, res);
    } catch (error) {
      console.error('❌ API 处理错误:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'API 处理失败',
        details: error.message 
      }));
    }
    return;
  }

  // 静态文件服务
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, filePath);
  
  console.log('📁 提供静态文件:', filePath);

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        console.log('📄 文件未找到，返回 index.html');
        fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
          if (err) {
            res.writeHead(404);
            res.end('Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
          }
        });
      } else {
        console.error('❌ 文件读取错误:', error);
        res.writeHead(500);
        res.end('Server Error');
      }
    } else {
      const ext = path.extname(filePath);
      const contentType = 
        ext === '.html' ? 'text/html' :
        ext === '.js' ? 'text/javascript' :
        ext === '.css' ? 'text/css' : 'text/plain';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(port, () => {
  console.log(`✅ 服务器运行在 http://localhost:${port}/`);
  console.log(`🎯 API 端点: http://localhost:${port}/api/generate-capsule`);
  console.log(`📁 静态文件服务已启用`);
});

// 错误处理
server.on('error', (error) => {
  console.error('❌ 服务器错误:', error);
});
