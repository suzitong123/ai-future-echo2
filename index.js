// index.js - 统一请求体解析版本
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const port = process.env.PORT || 3000;

console.log('🚀 启动服务器...');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon'
};

// 解析请求体
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        if (body) {
          resolve(JSON.parse(body));
        } else {
          resolve({});
        }
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  console.log(`📨 收到请求: ${req.method} ${pathname}`);

  // 设置 CORS 头部
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    console.log('🔄 处理 OPTIONS 预检请求');
    res.writeHead(200);
    res.end();
    return;
  }

  // API 路由处理
  if (pathname === '/api/generate-capsule' && req.method === 'POST') {
    console.log('🎯 处理 API 请求');
    try {
      const body = await parseBody(req);
      console.log('📝 解析的请求体:', body);
      
      // 动态导入 API 处理器，并传递解析好的 body
      const apiHandler = require('./api/generate-capsule/index.js');
      
      // 创建增强的请求对象，包含解析好的 body
      const enhancedReq = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: body // 直接传递解析好的 body
      };
      
      await apiHandler(enhancedReq, res);
      
    } catch (error) {
      console.error('❌ API 处理错误:', error);
      res.writeHead(500, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message
      }));
    }
    return;
  }

  // 静态文件服务
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(__dirname, filePath);

  console.log('📁 提供静态文件:', filePath);

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        console.log('📄 文件未找到，返回 index.html');
        fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
          if (err) {
            res.writeHead(404);
            res.end('File not found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
          }
        });
      } else {
        console.error('❌ 文件读取错误:', error);
        res.writeHead(500);
        res.end('Server error: ' + error.code);
      }
    } else {
      const extname = path.extname(filePath);
      const contentType = mimeTypes[extname] || 'text/html';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
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

process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获异常:', error);
});
