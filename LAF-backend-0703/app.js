const dotenv = require('dotenv');
dotenv.config();

const path = require('path');
const express = require('express');
const cors = require('cors'); // 引入 cors
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// --- 引入路由文件 ---
const locationRoutes = require('./routes/location'); 
const itemRoutes = require('./routes/items'); 
const mapRoutes = require('./routes/map');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const parseRoutes = require('./routes/intelli-parse');
const notiRoutes = require('./routes/notifications');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();

// --- 中间件配置 (顺序非常重要!) ---

// 1. 配置CORS，允许你的前端访问
//    这必须是所有路由之前的第一个或前几个中间件！
app.use(cors({
  origin: 'http://localhost:5173' // 精确指定允许的来源
}));

// 2. 其他安全和解析中间件
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 3. 速率限制
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 200, 
  message: { /* ... */ }
});
app.use('/v1', limiter);

// --- API 路由注册 ---
app.use('/v1/locations', locationRoutes);
app.use('/v1/items', itemRoutes);
app.use('/v1/map', mapRoutes);
app.use('/v1/auth', authRoutes);
app.use('/v1/profile', profileRoutes);
app.use('/v1/intelli-parse', parseRoutes);
app.use('/v1/notifications', notiRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    code: 200,
    message: '服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// 错误处理中间件
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

module.exports = app;
