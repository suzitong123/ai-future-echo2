// index.js - 修复版服务器
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const port = process.env.PORT || 3000;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
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

  console.log(`收到请求: ${req.method} ${pathname}`);

  // 设置 CORS 头部 - 完整支持
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

  // API 路由处理
  if (pathname === '/api/generate-capsule' && req.method === 'POST') {
    console.log('处理 API 请求');
    try {
      const body = await parseBody(req);
      console.log('解析的请求体:', body);
      
      // 动态导入 API 处理器
      const apiHandler = require('./api/generate-capsule/index.js');
      
      // 创建增强的请求对象
      const enhancedReq = {
        ...req,
        body: body,
        method: req.method,
        url: req.url,
        headers: req.headers
      };
      
      // 创建增强的响应对象
      const enhancedRes = {
        ...res,
        setHeader: function(name, value) {
          res.setHeader(name, value);
        },
        writeHead: function(statusCode, headers) {
          res.writeHead(statusCode, headers);
        },
        end: function(data) {
          console.log('API 响应完成');
          res.end(data);
        }
      };
      
      await apiHandler(enhancedReq, enhancedRes);
    } catch (error) {
      console.error('API 处理错误:', error);
      res.writeHead(500, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }));
    }
    return;
  }

  // 静态文件服务
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(__dirname, filePath);

  // 安全检查：防止目录遍历
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'text/html';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        console.log('文件未找到，返回 index.html');
        // 文件不存在，返回 index.html（支持前端路由）
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
        console.error('文件读取错误:', error);
        res.writeHead(500);
        res.end('Server error: ' + error.code);
      }
    } else {
      console.log('提供静态文件:', filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.on('clientError', (err, socket) => {
  console.error('客户端错误:', err);
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(port, () => {
  console.log(`🚀 服务器运行在 http://localhost:${port}/`);
  console.log(`📡 API 端点: http://localhost:${port}/api/generate-capsule`);
  console.log(`🌐 静态文件服务已启用`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM，优雅关闭服务器');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT，优雅关闭服务器');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

// 未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});
