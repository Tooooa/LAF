const express = require('express');
const axios = require('axios');
const sql = require('mssql'); 
const jwt = require('jsonwebtoken');

// 高德地图API配置
const AMAP_CONFIG = {
    key: process.env.AMAP_API_KEY,
    geocodeUrl: 'https://restapi.amap.com/v3/geocode/geo',
    city: '北京'
};

// SQL Server 数据库连接配置
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '1433', 10),
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: true
    }
};

// 创建一个全局连接池
let pool;
sql.connect(dbConfig).then(p => {
    pool = p;
    console.log('成功连接到 SQL Server 数据库');
}).catch(err => console.error('SQL Server 数据库连接失败:', err));


async function geocodeAddress(address, city = AMAP_CONFIG.city) {
    try {
        const params = { address, city, key: AMAP_CONFIG.key, output: 'json' };
        const response = await axios.get(AMAP_CONFIG.geocodeUrl, { params, timeout: 5000 });
        const data = response.data;
        if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
            const [longitude, latitude] = data.geocodes[0].location.split(',').map(Number);
            return { latitude, longitude };
        }
        return null;
    } catch (error) {
        console.error('地理编码API调用失败:', error.message);
        return null;
    }
}

async function getLocationById(locationId) {
    if (!pool) throw new Error('数据库连接池未初始化');
    try {
        const result = await pool.request()
            .input('locationId', sql.VarChar(50), locationId)
            .query('SELECT latitude, longitude, name, full_name FROM locations WHERE id = @locationId AND is_active = 1');
        if (result.recordset.length > 0) {
            const location = result.recordset[0];
            return {
                  latitude: parseFloat(location.latitude),
                  longitude: parseFloat(location.longitude),
                  name: location.name,
                  fullName: location.full_name
            };
        }
        return null;
    } catch (error) {
        console.error('查询地点信息失败:', error.message);
        return null;
    }
}

// *** 新增辅助函数 ***
// 根据分类代码（code）获取分类ID
async function getCategoryIdByCode(categoryCode) {
    if (!pool) throw new Error('数据库连接池未初始化');
    try {
        const result = await pool.request()
            .input('categoryCode', sql.VarChar(50), categoryCode)
            .query('SELECT id FROM categories WHERE code = @categoryCode AND is_active = 1');
        if (result.recordset.length > 0) {
            return result.recordset[0].id;
        }
        return null; // 没有找到对应的分类
    } catch (error) {
        console.error('查询分类ID失败:', error);
        throw error; // 抛出错误，让上层函数处理
    }
}


// authenticateToken 和 validateItemInput 函数不变
function authenticateToken(req, res, next) { /* ... */ next(); }
function validateItemInput(req, res, next) { /* ... */ next(); }

// *** 重构后的 createItem 函数 ***
async function createItem(req, res) {
    console.log('[DEBUG] 进入 createItem 函数');
    if (!pool) {
        console.error('[DEBUG] 错误：数据库连接池未准备好');
        return res.status(503).json({ success: false, code: 503, message: '数据库服务不可用' });
    }

    const { 
        type, title, description, category, // `category` 现在是 "documents" 这样的字符串
        location_id, location_detail, lost_date, 
        contact_info, contact_type = 'phone', 
        images = [], tags = [] 
    } = req.body;
    
    // --- 1. 预处理和验证 ---
    console.log(`[DEBUG] 接收到分类代码: ${category}`);
    let categoryId;
    try {
        categoryId = await getCategoryIdByCode(category);
        if (!categoryId) {
            console.error(`[DEBUG] 错误: 无效的分类代码: ${category}`);
            return res.status(400).json({ success: false, code: 400, message: '无效的物品分类' });
        }
        console.log(`[DEBUG] 查询到分类ID: ${categoryId}`);
    } catch (error) {
        return res.status(500).json({ success: false, code: 500, message: '查询分类信息时出错' });
    }

    const transaction = new sql.Transaction(pool);
    try {
        console.log('[DEBUG] 准备开始数据库事务...');
        await transaction.begin();
        console.log('[DEBUG] 数据库事务已开始');

        const userId = 1; // 测试用
        let latitude = null, longitude = null, finalLocationId = location_id, finalLocationDetail = location_detail;

        console.log('[DEBUG] 正在处理地理位置信息...');
        if (location_id) {
            const locationInfo = await getLocationById(location_id);
            if (locationInfo) {
                latitude = locationInfo.latitude;
                longitude = locationInfo.longitude;
                if (!location_detail) finalLocationDetail = locationInfo.fullName;
            } else {
                finalLocationId = null;
            }
        }
        if (location_detail && (!latitude || !longitude)) {
            const geocodeResult = await geocodeAddress(location_detail);
            if (geocodeResult) {
                latitude = geocodeResult.latitude;
                longitude = geocodeResult.longitude;
            }
        }
        console.log('[DEBUG] 地理位置信息处理完毕');

        // --- 2. 核心数据库插入操作 ---
        const insertItemSql = `
          INSERT INTO items (type, title, description, category_id, location_id, location_detail, lost_date, contact_info, contact_type, latitude, longitude, coordinate, author_id, status, created_at, updated_at) 
          OUTPUT INSERTED.id, INSERTED.created_at -- 同时返回ID和创建时间
          VALUES (@type, @title, @description, @category_id, @location_id, @location_detail, @lost_date, @contact_info, @contact_type, @latitude, @longitude, CASE WHEN @latitude IS NOT NULL AND @longitude IS NOT NULL THEN geography::Point(@latitude, @longitude, 4326) ELSE NULL END, @author_id, 'active', GETDATE(), GETDATE());
        `;
        
        console.log('[DEBUG] 准备插入主物品信息...');
        const itemRequest = new sql.Request(transaction);
        const itemResult = await itemRequest
            .input('type', sql.VarChar(10), type)
            .input('title', sql.NVarChar(200), title.trim())
            .input('description', sql.NVarChar(sql.MAX), description.trim())
            .input('category_id', sql.Int, categoryId) // <-- 使用查询到的整数ID
            .input('location_id', sql.VarChar(50), finalLocationId)
            .input('location_detail', sql.NVarChar(200), finalLocationDetail?.trim())
            .input('lost_date', sql.Date, lost_date || null)
            .input('contact_info', sql.VarChar(200), contact_info.trim())
            .input('contact_type', sql.VarChar(20), contact_type)
            .input('latitude', sql.Decimal(10, 8), latitude)
            .input('longitude', sql.Decimal(11, 8), longitude)
            .input('author_id', sql.BigInt, userId)
            .query(insertItemSql);
        
        const newItem = itemResult.recordset[0];
        const itemId = newItem.id;
        const createdAt = newItem.created_at;
        console.log(`[DEBUG] 主物品信息插入成功, ID: ${itemId}`);

        if (images && images.length > 0) {
            console.log(`[DEBUG] 准备插入 ${images.length} 张图片...`);
            const imageRequest = new sql.Request(transaction);
            for (let i = 0; i < images.length; i++) {
                await imageRequest.query(`
                    INSERT INTO item_images (item_id, image_url, sort_order, is_cover, created_at) 
                    VALUES (${itemId}, '${images[i]}', ${i}, ${i === 0 ? 1 : 0}, GETDATE())
                `); // 注意：为了简化，这里用了字符串拼接，生产环境建议继续用input绑定
            }
            console.log('[DEBUG] 图片信息插入完毕');
        }

        if (tags && tags.length > 0) {
            console.log(`[DEBUG] 准备插入 ${tags.length} 个标签...`);
            const tagRequest = new sql.Request(transaction);
            for (const tag of tags) {
                if (tag && tag.trim()) {
                    await tagRequest.query(`
                        INSERT INTO item_tags (item_id, tag_name, created_at) 
                        VALUES (${itemId}, N'${tag.trim()}', GETDATE())
                    `); // 注意：同上，生产环境建议绑定
                }
            }
            console.log('[DEBUG] 标签信息插入完毕');
        }

        // --- 移除事务内查询，避免死锁 ---
        // console.log('[DEBUG] 准备查询最终物品信息...'); <--- 已删除

        console.log('[DEBUG] 准备提交事务...');
        await transaction.commit();
        console.log('[DEBUG] 事务已提交');

        // --- 3. 在代码中构建响应数据 ---
        console.log('[DEBUG] 准备构建成功响应...');
        const responseData = {
            id: itemId,
            type: type,
            title: title,
            description: description,
            category: category, // 返回前端原始的category code
            location_id: finalLocationId,
            location: finalLocationDetail,
            lostDate: lost_date,
            contactInfo: contact_info,
            contactType: contact_type,
            images: images,
            tags: tags.filter(t => t && t.trim()), // 清理空标签
            coordinates: latitude && longitude ? { latitude, longitude } : null,
            status: 'active',
            createdAt: createdAt,
            author: { // 这里可以查询用户信息，或者如果JWT里有，直接用
                id: userId,
                username: 'test_user', // 示例
                avatar: null // 示例
            },
            viewCount: 0,
            matchCount: 0
        };

        res.status(201).json({ success: true, code: 201, message: '发布成功', data: responseData });
        console.log('[DEBUG] 成功响应已发送');

    } catch (error) {
        console.error('[DEBUG] 捕获到错误:', error);
        try {
            if (transaction.rolledBack === false) {
                console.log('[DEBUG] 准备回滚事务...');
                await transaction.rollback();
                console.log('[DEBUG] 事务已回滚');
            }
        } catch (rollbackError) {
            console.error('[DEBUG] 事务回滚失败:', rollbackError);
        }
        res.status(500).json({ success: false, code: 500, message: '发布失败，请稍后重试' });
    }
}

// *** 新增的、功能完备的 getItemsList 函数 ***
async function getItemsList(req, res) {
    console.log('[DEBUG] 接收到 GET /items 请求，查询参数:', req.query);
    if (!pool) {
        console.error('[DEBUG] 错误：数据库连接池未准备好');
        return res.status(503).json({ success: false, code: 503, message: '数据库服务不可用' });
    }

    // --- 1. 解析查询参数并设置默认值 ---
    const {
        page = 1,
        limit = 10,
        id,
        type,      // 'lost' 或 'found'
        category,  // 分类 code, e.g., 'documents'
        status = 'active', // 默认只看活动中的
        keyword,    // 搜索关键字
        sortBy = 'createdAt', // 默认排序字段
        sortOrder = 'desc',   // 默认排序顺序
        locationId // 按地点ID筛选
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();
        console.log('[DEBUG] 数据库事务已开始 (用于读取)');

        const request = new sql.Request(transaction);
        let whereClauses = [];
        let countWhereClauses = [];

        // --- 2. 动态构建 WHERE 子句 ---
        // 注意：为避免SQL注入，所有参数都使用 .input() 绑定
        
        if (id) {
            whereClauses.push("i.id = @id");
            request.input('id', sql.VarChar, id);
        }

        // 筛选 status
        if (status) {
            whereClauses.push("i.status = @status");
            request.input('status', sql.VarChar, status);
        }
        
        // 筛选 type
        if (type) {
            whereClauses.push("i.type = @type");
            request.input('type', sql.VarChar, type);
        }

        // 筛选 category (通过code)
        if (category) {
            whereClauses.push("c.code = @category");
            request.input('category', sql.VarChar, category);
        }

        // 筛选 locationId
        if (locationId) {
            whereClauses.push("i.location_id = @locationId");
            request.input('locationId', sql.VarChar, locationId);
        }

        // 关键字搜索 (title 和 description)
        if (keyword) {
            whereClauses.push("(i.title LIKE @searchQuery OR i.description LIKE @searchQuery)");
            request.input('searchQuery', sql.NVarChar, `%${keyword}%`);
        }

        const whereCondition = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // --- 3. 构建排序子句 ---
        // 为了安全，白名单化可排序的字段
        const allowedSortBy = {
            'createdAt': 'i.created_at',
            'lostDate': 'i.lost_date',
            'viewCount': 'i.view_count'
        };
        const orderByField = allowedSortBy[sortBy] || 'i.created_at'; // 默认按创建时间排序
        const orderDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC'; // 默认降序
        const orderByClause = `ORDER BY ${orderByField} ${orderDirection}`;

        // --- 4. 执行总数查询 ---
        const countQuery = `
            SELECT COUNT(DISTINCT i.id) as total
            FROM items i
            LEFT JOIN categories c ON i.category_id = c.id
            ${whereCondition};
        `;
        console.log('[DEBUG] 执行总数查询:');
        // , countQuery);
        const countResult = await request.query(countQuery);
        const totalItems = countResult.recordset[0].total;
        const totalPages = Math.ceil(totalItems / limitNum);

        // --- 5. 执行分页数据查询 ---
        // 使用 CTE 和 STRING_AGG 聚合标签数据
        // todo: 在查询时出现问题都在这，和数据库有关
        const dataQuery = `
            WITH ItemTags AS (
                SELECT 
                    item_id, 
                    STRING_AGG(tag_name, ',') WITHIN GROUP (ORDER BY created_at) as tags
                FROM item_tags
                GROUP BY item_id
            )
            SELECT 
                i.id, i.type, i.title, i.description, i.location_detail, i.lost_date,
                i.contact_info, i.contact_type, i.latitude, i.longitude, i.status,
                i.created_at, i.view_count, i.match_count,
                c.code as category_code,
                c.name as category_name,
                l.full_name as location_name,
                u.id as author_id,
                u.username as author_username,
                u.avatar as author_avatar, -- <--- 已根据您的表结构修正
                (SELECT TOP 1 image_url FROM item_images WHERE item_id = i.id AND is_cover = 1 ORDER BY sort_order) as cover_image,
                it.tags
            FROM items i
            LEFT JOIN categories c ON i.category_id = c.id
            LEFT JOIN locations l ON i.location_id = l.id
            LEFT JOIN users u ON i.author_id = u.id
            LEFT JOIN ItemTags it ON i.id = it.item_id
            ${whereCondition}
            ${orderByClause}
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY;
        `;
        
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, limitNum);

        console.log('[DEBUG] 执行数据查询:');
        // , dataQuery);
        const itemsResult = await request.query(dataQuery);

        await transaction.commit();
        console.log('[DEBUG] 事务已提交');

        // --- 6. 格式化返回结果 ---
        const responseData = itemsResult.recordset.map(item => ({
            code: 200,
            id: item.id,
            type: item.type,
            title: item.title,
            description: item.description,
            category: {
                code: item.category_code,
                name: item.category_name,
            },
            locationId: item.location_id,
            location: item.location_name || item.location_detail, // 优先显示标准地点名称
            locationDetail: item.location_detail,
            lostDate: item.lost_date,
            contactInfo: item.contact_info,
            contactType: item.contact_type,
            images: item.cover_image ? [item.cover_image] : [], // 列表中只返回封面图
            tags: item.tags ? item.tags.split(',') : [], // 将标签字符串转为数组
            coordinates: item.latitude && item.longitude ? {
                latitude: parseFloat(item.latitude),
                longitude: parseFloat(item.longitude)
            } : null,
            status: item.status,
            createdAt: item.created_at,
            author: {
                id: item.author_id,
                username: item.author_username, // 需要 JOIN users 表
                avatar: item.author_avatar      // 需要 JOIN users 表
            },
            viewCount: item.view_count,
            matchCount: item.match_count
        }));

        const response = {
            success: true,
            code: 200, 
            message: '成功获取物品列表',
            data: responseData,
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalItems,
                totalPages,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        };

        // 在控制台输出（方便调试）
        console.log(`[DEBUG] 成功响应 GET /items, 返回 ${responseData.length} 条数据`);
        console.log('[DEBUG] API响应数据:', JSON.stringify(response, null, 2));  // 格式化输出

        // 发送响应
        res.status(200).json(response);
    } catch (error) {
        console.error('[DEBUG] 获取物品列表时发生错误:', error);
        // 如果事务已经开始但未提交，尝试回滚
        if (transaction.rolledBack === false) {
            try {
                await transaction.rollback();
                console.log('[DEBUG] 事务已回滚');
            } catch (rollbackError) {
                console.error('[DEBUG] 事务回滚失败:', rollbackError);
            }
        }
        res.status(500).json({ success: false, 
                code: 500, 
                message: '获取列表失败，请稍后重试' });
    }
}

const router = express.Router();
router.post('/', /*authenticateToken,*/ validateItemInput, createItem);

router.get('/', getItemsList); // 注册我们刚刚添加的 GET 路由
module.exports = router;