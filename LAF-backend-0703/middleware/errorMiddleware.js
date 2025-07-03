const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // SQL Server 错误
  if (err.name === 'ConnectionError' || err.name === 'RequestError') {
    return res.status(500).json({
      success: false,
      code: 500,
      message: '数据库连接错误',
      timestamp: new Date().toISOString()
    });
  }
  
  // 其他错误
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';
  
  res.status(statusCode).json({
    success: false,
    code: statusCode,
    message: message,
    timestamp: new Date().toISOString()
  });
};

const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    code: 404,
    message: `接口 ${req.originalUrl} 不存在`,
    timestamp: new Date().toISOString()
  });
};

module.exports = { errorHandler, notFound };