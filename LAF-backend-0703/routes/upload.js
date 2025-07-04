// routes/upload.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// --- 1. 配置上传目录 ---
// 我们将图片存储在项目根目录下的 'public/uploads' 文件夹中
// path.join(__dirname, '..', 'public', 'uploads') 会生成一个绝对路径
// 比如，如果你的项目在 /app/src/routes, 它会指向 /app/public/uploads
const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads');

// 确保上传目录存在，如果不存在则创建
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`上传目录创建成功: ${UPLOAD_DIR}`);
}

// --- 2. 配置 Multer 中间件 ---
const storage = multer.diskStorage({
  // destination: 设置文件的存储位置
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  // filename: 设置保存的文件名，为了避免重名，我们使用 时间戳 + 随机数 + 原始文件扩展名 的组合
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// 文件过滤器，只接受图片类型
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true); // 接受文件
  } else {
    cb(new Error('文件类型不匹配！只允许上传图片。'), false); // 拒绝文件
  }
};

// 创建 multer 实例
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制文件大小为 5MB
  }
});

// --- 3. 定义上传路由 ---
/**
 * @route   POST /api/upload/image
 * @desc    处理单个图片上传
 * @access  Public (或根据需要添加 authenticateToken 中间件)
 * 
 * 中间件 upload.single('file') 会处理名为 'file' 的文件字段。
 * 这个 'file' 必须与你前端 FormData.append('file', file) 中的字段名一致。
 */
router.post('/image', upload.single('file'), (req, res) => {
  // 如果 multer 处理出错（例如文件过大或类型不符），它会传递一个错误
  // 我们可以在一个集中的错误处理中间件中处理，或者在这里简单判断
  
  // 检查文件是否成功上传
  if (!req.file) {
    return res.status(400).json({
      success: false,
      code: 400,
      message: '上传失败，请确保已选择图片文件。'
    });
  }

  // 从 req.body 中可以获取附带的 'type' 字段
  const uploadType = req.body.type;
  console.log(`[DEBUG] 收到类型为 '${uploadType}' 的图片上传, 文件信息:`, req.file);
  
  // 构建可公开访问的 URL
  // 假设你的服务器配置了 'public' 文件夹为静态资源目录
  // 那么 URL 就是 /uploads/文件名
  const fileUrl = `/uploads/${req.file.filename}`;
  
  // 返回成功响应，其中包含图片的 URL
  res.status(200).json({
    success: true,
    code: 200,
    message: '上传成功',
    data: {
      url: fileUrl, // 前端最需要的就是这个 URL
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    }
  });
});

// Multer 错误处理中间件 (可选, 但推荐)
// 放在路由定义之后，这样可以捕获上面路由中发生的 multer 错误
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, code: 413, message: '文件太大，请上传5MB以下的图片。' });
        }
        return res.status(400).json({ success: false, code: 400, message: `上传出错: ${error.message}` });
    } else if (error) {
        // An unknown error occurred when uploading.
        return res.status(400).json({ success: false, code: 400, message: error.message });
    }
    next();
});


module.exports = router;