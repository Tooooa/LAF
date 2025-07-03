# 🎓 LAF - 校园失物招领平台

LAF (Lost And Found) 是一个专为校园设计的现代化失物招领平台，提供直观的地图浏览、智能搜索、实时通知等功能，帮助师生快速找回失物或归还拾获物品。

## 📋 项目概述

### 项目目标
- 为校园师生提供便捷的失物招领服务
- 通过地图可视化展示物品分布
- 提供智能搜索和匹配功能
- 建立安全可靠的物品交换平台

### 核心特性
- 🗺️ **地图可视化** - 基于高德地图API的实时物品分布展示
- 🔍 **智能搜索** - 支持关键词、分类、时间等多维度搜索
- 📱 **响应式设计** - 完美适配PC端和移动端
- 🔐 **用户认证** - JWT token认证机制
- 📊 **数据统计** - 热力图展示物品密集区域
- 🏷️ **分类管理** - 完善的物品分类体系
- 📍 **地点管理** - 校园地点数据库和智能建议

## 🏗️ 技术架构

### 后端技术栈
- **Node.js** - 运行环境
- **Express.js** - Web框架
- **SQL Server** - 主数据库
- **JWT** - 用户认证
- **高德地图API** - 地理编码和地图服务
- **Joi** - 数据验证
- **Helmet** - 安全中间件
- **Rate Limiting** - 请求频率限制

### 前端技术栈
- **HTML5/CSS3** - 页面结构和样式
- **JavaScript (ES6+)** - 交互逻辑
- **高德地图JavaScript API** - 地图组件
- **响应式设计** - 移动端适配

### 项目结构
```
LAF/
├── app.js                 # 应用入口文件
├── package.json           # 项目依赖配置
├── campus_lost_found.html # 前端主页面
├── config/                # 配置文件
│   └── database.js        # 数据库配置
├── controllers/           # 控制器层
│   └── mapController.js   # 地图相关控制器
├── middleware/            # 中间件
│   ├── asyncHandler.js    # 异步错误处理
│   ├── auth.js           # 认证中间件
│   ├── errorMiddleware.js # 错误处理中间件
│   └── validation.js     # 数据验证中间件
├── models/               # 数据模型
│   └── Location.js       # 地点模型
├── routes/               # 路由定义
│   ├── items.js         # 物品相关路由
│   ├── location.js      # 地点相关路由
│   └── map.js           # 地图相关路由
├── utils/               # 工具函数
│   └── response.js      # 响应格式化工具
└── public/              # 静态资源
    └── index.html       # 静态页面
```

## 🚀 快速开始

### 环境要求
- Node.js >= 14.0.0
- SQL Server >= 2016
- 高德地图API密钥

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd LAF
```

2. **安装依赖**
```bash
npm install
```

3. **环境配置**
创建 `.env` 文件并配置以下环境变量：
```env
# 服务器配置
PORT=3000

# 数据库配置
DB_HOST=localhost
DB_PORT=1433
DB_NAME=laf_database
DB_USER=your_username
DB_PASSWORD=your_password
DB_ENCRYPT=true

# 高德地图API配置
AMAP_API_KEY=your_amap_api_key

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
```

4. **数据库初始化**
```sql
-- 创建数据库表结构（需要根据实际需求调整）
CREATE DATABASE laf_database;
USE laf_database;

-- 用户表
CREATE TABLE users (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    phone NVARCHAR(20),
    email NVARCHAR(100),
    avatar NVARCHAR(255),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- 地点表
CREATE TABLE locations (
    id NVARCHAR(50) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    full_name NVARCHAR(200) NOT NULL,
    type NVARCHAR(20) NOT NULL,
    parent_id NVARCHAR(50),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE()
);

-- 分类表
CREATE TABLE categories (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(50) NOT NULL,
    code NVARCHAR(20) NOT NULL UNIQUE,
    description NVARCHAR(200),
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE()
);

-- 物品表
CREATE TABLE items (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    type NVARCHAR(10) NOT NULL, -- 'lost' 或 'found'
    title NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX),
    category_id INT,
    location_id NVARCHAR(50),
    location_detail NVARCHAR(200),
    lost_date DATE,
    contact_info NVARCHAR(200) NOT NULL,
    contact_type NVARCHAR(20) DEFAULT 'phone',
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    coordinate AS geography::Point(latitude, longitude, 4326),
    author_id BIGINT,
    status NVARCHAR(20) DEFAULT 'active',
    view_count INT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (location_id) REFERENCES locations(id),
    FOREIGN KEY (author_id) REFERENCES users(id)
);

-- 物品图片表
CREATE TABLE item_images (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    item_id BIGINT NOT NULL,
    image_url NVARCHAR(500) NOT NULL,
    sort_order INT DEFAULT 0,
    is_cover BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (item_id) REFERENCES items(id)
);

-- 物品标签表
CREATE TABLE item_tags (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    item_id BIGINT NOT NULL,
    tag_name NVARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (item_id) REFERENCES items(id)
);
```

5. **启动服务**
```bash
npm start
```

6. **访问应用**
打开浏览器访问：`http://localhost:3000`

## 📚 API文档

### 基础信息
- **基础URL**: `http://localhost:3000/v1`
- **认证方式**: JWT Bearer Token
- **响应格式**: JSON

### 通用响应格式
```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": {},
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### 物品管理 API

#### 1. 创建物品
- **POST** `/items`
- **描述**: 发布新的失物或招领信息
- **请求体**:
```json
{
  "type": "lost",           // "lost" 或 "found"
  "title": "蓝色钱包",
  "description": "昨天在图书馆三楼遗失蓝色皮质钱包",
  "category": "documents",  // 分类代码
  "location_id": "lib_3f",  // 地点ID（可选）
  "location_detail": "图书馆三楼阅览室",
  "lost_date": "2025-01-14",
  "contact_info": "13812345678",
  "contact_type": "phone",
  "images": ["url1", "url2"],
  "tags": ["钱包", "蓝色"]
}
```

#### 2. 获取物品列表
- **GET** `/items`
- **描述**: 获取物品列表，支持分页和筛选
- **查询参数**:
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认20）
  - `type`: 物品类型（lost/found）
  - `category`: 分类筛选
  - `keyword`: 关键词搜索
  - `sortBy`: 排序字段（date/view_count）
  - `sortOrder`: 排序方向（asc/desc）

#### 3. 获取物品详情
- **GET** `/items/:id`
- **描述**: 获取指定物品的详细信息

#### 4. 更新物品状态
- **PUT** `/items/:id/status`
- **描述**: 更新物品状态（active/resolved/closed）

### 地点管理 API

#### 1. 获取地点建议
- **GET** `/locations/suggestions`
- **描述**: 根据关键词获取地点建议
- **查询参数**:
  - `query`: 搜索关键词
  - `type`: 地点类型（building/area/room/other/all）
  - `limit`: 返回数量限制

#### 2. 获取热门地点
- **GET** `/locations/popular`
- **描述**: 获取热门地点列表

#### 3. 获取地点详情
- **GET** `/locations/:id`
- **描述**: 获取指定地点的详细信息

#### 4. 获取子地点
- **GET** `/locations/:id/children`
- **描述**: 获取指定地点的子地点列表

### 地图 API

#### 1. 获取地图物品数据
- **GET** `/map/items`
- **描述**: 获取指定地图范围内的物品数据
- **查询参数**:
  - `bounds`: 地图边界 "minLng,minLat,maxLng,maxLat"
  - `type`: 物品类型筛选
  - `timeRange`: 时间范围（7d/30d/90d/all）
  - `category`: 分类筛选
  - `status`: 物品状态筛选

**响应示例**:
```json
{
  "success": true,
  "code": 200,
  "message": "获取成功",
  "data": {
    "items": [
      {
        "id": 1,
        "title": "蓝色钱包",
        "type": "lost",
        "coordinates": {
          "latitude": 39.991361,
          "longitude": 116.335136
        },
        "location": "图书馆三楼",
        "category": "证件文件",
        "matchCount": 2
      }
    ],
    "heatmapData": [
      {
        "coordinates": {
          "latitude": 39.991361,
          "longitude": 116.335136
        },
        "weight": 5
      }
    ],
    "statistics": {
      "total": 100,
      "lost": 60,
      "found": 40
    }
  }
}
```

## 🎯 功能使用说明

### 1. 首页浏览
- 查看最新发布的失物招领信息
- 支持按类型筛选（全部/失物/招领）
- 实时更新信息列表

### 2. 发布信息
- 选择物品类型（失物/招领）
- 填写物品详细信息
- 选择或输入地点（支持智能建议）
- 上传物品图片
- 设置联系方式

### 3. 搜索功能
- **关键词搜索**: 支持物品名称、描述、地点搜索
- **分类筛选**: 按物品分类筛选
- **类型筛选**: 失物或招领
- **时间筛选**: 按日期范围筛选

### 4. 地图浏览
- **可视化展示**: 在地图上显示物品位置
- **热力图**: 显示物品密集区域
- **实时筛选**: 支持类型、时间、分类筛选
- **详情查看**: 点击标记查看物品详情

### 5. 个人中心
- 查看个人信息
- 管理已发布的信息
- 编辑或删除信息
- 标记物品状态

## 🔧 开发指南

### 代码规范
- 使用ES6+语法
- 遵循RESTful API设计原则
- 统一错误处理和响应格式
- 添加必要的注释和文档

### 数据库设计原则
- 使用外键约束保证数据完整性
- 合理设计索引提高查询性能
- 使用地理数据类型支持空间查询
- 实现软删除机制

### 安全考虑
- 使用HTTPS协议
- 实现请求频率限制
- 数据验证和过滤
- JWT token认证
- SQL注入防护

## 🚀 部署指南

### 生产环境部署
1. **服务器准备**
   - 配置Node.js环境
   - 安装SQL Server
   - 配置反向代理（Nginx）

2. **环境变量配置**
   - 设置生产环境变量
   - 配置数据库连接
   - 设置API密钥

3. **PM2进程管理**
```bash
npm install -g pm2
pm2 start app.js --name laf
pm2 save
pm2 startup
```

4. **Nginx配置**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 性能优化

### 数据库优化
- 合理设计索引
- 使用连接池
- 查询优化
- 分页查询

### 前端优化
- 图片压缩和CDN
- 代码压缩
- 缓存策略
- 懒加载

### API优化
- 请求缓存
- 数据压缩
- 分页加载
- 异步处理

## 🐛 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库服务状态
   - 验证连接配置
   - 确认网络连接

2. **地图无法显示**
   - 检查高德地图API密钥
   - 确认域名白名单配置
   - 验证API调用限制

3. **图片上传失败**
   - 检查文件大小限制
   - 确认存储路径权限
   - 验证文件格式支持

### 日志查看
```bash
# 查看应用日志
pm2 logs laf

# 查看错误日志
pm2 logs laf --err

# 实时监控
pm2 monit
```

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- 项目维护者: [维护者姓名]
- 邮箱: [邮箱地址]
- 项目地址: [GitHub地址]

## 🔄 更新日志

### v1.0.0 (2025-01-15)
- 初始版本发布
- 基础失物招领功能
- 地图可视化功能
- 用户认证系统
- 响应式设计

---

**注意**: 本项目仍在积极开发中，功能可能会有所变化。如有问题或建议，请通过Issues反馈。 