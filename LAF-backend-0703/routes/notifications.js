const express = require('express');
const router = express.Router();
const sql = require('mssql');

// --- 1. 数据库连接 (与你的 items.js 保持一致) ---
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

// 创建一个在此文件作用域内可用的连接池变量
let pool;
// 连接数据库，并在成功后将连接池实例赋值给 pool
sql.connect(dbConfig)
    .then(p => {
        pool = p;
        // console.log('通知模块(notifications.js)已成功连接到 SQL Server');
    })
    .catch(err => console.error('通知模块(notifications.js)数据库连接失败:', err));


// --- 2. API 路由处理函数 (重写后) ---

/**
 * GET / - 获取用户的通知列表
 * @query {string} userId - 接收通知的用户的ID
 */
async function getNotificationsList(req, res) {
    const { userId } = req.query; // 从 GET 请求的查询参数中获取 userId

    // 检查 userId 是否存在
    if (!userId) {
        return res.status(400).json({ success: false, message: '必须提供 userId 参数' });
    }
    // 检查数据库连接池是否准备好
    if (!pool) {
        return res.status(503).json({ success: false, message: '数据库服务暂不可用，请稍后重试' });
    }

    try {
        const request = pool.request();
        const query = `
            SELECT id, type, title, content, data, status, created_at
            FROM notifications
            WHERE user_id = @userId AND status != 'deleted'
            ORDER BY created_at DESC;
        `;
        
        request.input('userId', sql.BigInt, userId);
        
        const result = await request.query(query);

        res.status(200).json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('获取通知列表失败:', error);
        res.status(500).json({ success: false, message: '服务器内部错误' });
    }
}

/**
 * PUT /:id/read - 将通知标记为已读
 * @param {string} id - 通知ID
 * @body {string} userId - 当前操作用户的ID (用于权限验证)
 */
async function markAsRead(req, res) {
    const { id } = req.params; // 从 URL 路径中获取通知 id
    const { userId } = req.body; // 从 PUT 请求的 body 中获取 userId

    if (!userId || !id) {
        return res.status(400).json({ success: false, message: '缺少必要的参数 (userId 或通知 id)' });
    }
    if (!pool) {
        return res.status(503).json({ success: false, message: '数据库服务暂不可用' });
    }

    try {
        const request = pool.request();
        const query = `
            UPDATE notifications
            SET status = 'read', read_at = SYSDATETIME()
            WHERE id = @id AND user_id = @userId AND status = 'unread';
        `;

        request.input('id', sql.BigInt, id);
        request.input('userId', sql.BigInt, userId);
        
        const result = await request.query(query);

        if (result.rowsAffected[0] > 0) {
            res.status(200).json({ success: true, message: '标记已读成功' });
        } else {
            res.status(404).json({ success: false, message: '操作失败，通知不存在、已被读或无权限' });
        }
    } catch (error) {
        console.error('标记已读失败:', error);
        res.status(500).json({ success: false, message: '服务器内部错误' });
    }
}

/**
 * DELETE /:id - 软删除通知
 * @param {string} id - 通知ID
 * @body {string} userId - 当前操作用户的ID (用于权限验证)
 */
async function deleteNotification(req, res) {
    const { id } = req.params;
    const { userId } = req.body; // 从 DELETE 请求的 body 中获取 userId

    if (!userId || !id) {
        return res.status(400).json({ success: false, message: '缺少必要的参数 (userId 或通知 id)' });
    }
    if (!pool) {
        return res.status(503).json({ success: false, message: '数据库服务暂不可用' });
    }

    try {
        const request = pool.request();
        const query = `
            UPDATE notifications
            SET status = 'deleted'
            WHERE id = @id AND user_id = @userId;
        `;
        
        request.input('id', sql.BigInt, id);
        request.input('userId', sql.BigInt, userId);

        const result = await request.query(query);
            
        if (result.rowsAffected[0] > 0) {
            res.status(200).json({ success: true, message: '删除成功' });
        } else {
            res.status(404).json({ success: false, message: '操作失败，通知不存在或无权限' });
        }
    } catch (error) {
        console.error('删除通知失败:', error);
        res.status(500).json({ success: false, message: '服务器内部错误' });
    }
}


// --- 3. 注册路由 ---
router.get('/', getNotificationsList);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;