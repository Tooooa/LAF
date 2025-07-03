const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'query' ? req.query : 
                 source === 'params' ? req.params : 
                 req.body;
    
    // 假设你使用了 Joi 来进行验证
    // 如果没有安装，请运行 npm install joi
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        code: 400,
        message: '请求参数错误',
        error: {
          type: 'VALIDATION_ERROR',
          details: details
        },
        timestamp: new Date().toISOString()
      });
    }
    
    // 将验证后的数据赋值回请求对象
    if (source === 'query') req.query = value;
    else if (source === 'params') req.params = value;
    else req.body = value;
    
    next();
  };
};

/**
 * 验证地图边界参数
 */
const validateBounds = (minLng, minLat, maxLng, maxLat) => {
    // 检查经纬度范围
    if (minLat < -90 || minLat > 90 || maxLat < -90 || maxLat > 90) {
        return false;
    }
    if (minLng < -180 || minLng > 180 || maxLng < -180 || maxLng > 180) {
        return false;
    }
    
    // 检查边界逻辑
    if (minLat >= maxLat || minLng >= maxLng) {
        return false;
    }
    
    // 检查范围大小（避免查询范围过大）
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    
    // 限制查询范围不超过1度x1度（约100km x 100km）
    if (latDiff > 1 || lngDiff > 1) {
        return false;
    }
    
    return true;
};

// [修正] 同时导出两个函数
module.exports = { 
    validateRequest,
    validateBounds 
};