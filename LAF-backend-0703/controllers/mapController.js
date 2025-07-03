const sql = require('mssql');
const { successResponse, errorResponse } = require('../utils/response');
const { validateBounds } = require('../middleware/validation');

/**
 * 获取地图范围内的物品数据
 * GET /map/items
 */
exports.getMapItems = async (req, res) => {
    try {
        const {
            bounds,          // 地图边界 "minLng,minLat,maxLng,maxLat"
            type,            // 物品类型 lost/found
            timeRange,       // 时间范围 7d/30d/90d/all
            category,        // 分类筛选
            status = 'active' // 物品状态，默认active
        } = req.query;

        // 验证必需参数
        if (!bounds) {
            return errorResponse(res, 400, '缺少地图边界参数');
        }

        // 解析边界参数
        const boundsArray = bounds.split(',').map(Number);
        if (boundsArray.length !== 4 || boundsArray.some(isNaN)) {
            return errorResponse(res, 400, '地图边界参数格式错误');
        }

        const [minLng, minLat, maxLng, maxLat] = boundsArray;

        // 验证边界范围的合理性
        if (!validateBounds(minLng, minLat, maxLng, maxLat)) {
            return errorResponse(res, 400, '地图边界参数超出有效范围');
        }

        // 构建边界多边形的WKT格式
        const boundaryWKT = `POLYGON((${minLng} ${minLat}, ${maxLng} ${minLat}, ${maxLng} ${maxLat}, ${minLng} ${maxLat}, ${minLng} ${minLat}))`;

        // 构建查询条件
        let whereConditions = ['i.coordinate.STIntersects(geography::STGeomFromText(@boundaryWKT, 4326)) = 1'];
        let parameters = [
            { name: 'boundaryWKT', type: sql.NVarChar, value: boundaryWKT }
        ];

        // 添加状态过滤
        if (status) {
            whereConditions.push('i.status = @status');
            parameters.push({ name: 'status', type: sql.NVarChar, value: status });
        }

        // 添加类型过滤
        if (type && ['lost', 'found'].includes(type)) {
            whereConditions.push('i.type = @type');
            parameters.push({ name: 'type', type: sql.NVarChar, value: type });
        }

        // 添加分类过滤
        if (category) {
            whereConditions.push('c.name = @category');
            parameters.push({ name: 'category', type: sql.NVarChar, value: category });
        }

        // 添加时间范围过滤
        if (timeRange && timeRange !== 'all') {
            const days = {
                '7d': 7,
                '30d': 30,
                '90d': 90
            }[timeRange];

            if (days) {
                whereConditions.push('i.created_at >= DATEADD(day, @days, GETDATE())');
                parameters.push({ name: 'days', type: sql.Int, value: -days });
            }
        }

        const whereClause = whereConditions.join(' AND ');

        // 查询地图范围内的物品
        const itemsQuery = `
            SELECT 
                i.id,
                i.title,
                i.type,
                i.latitude,
                i.longitude,
                i.location_detail,
                i.lost_date,
                i.created_at,
                i.status,
                i.view_count,
                c.name as category_name,
                u.username as author_name,
                u.avatar as author_avatar,
                -- 计算匹配度（简化版）
                CASE 
                    WHEN i.type = 'lost' THEN (
                        SELECT COUNT(*) 
                        FROM items i2 
                        WHERE i2.type = 'found' 
                        AND i2.category_id = i.category_id 
                        AND i2.status = 'active'
                        AND i2.coordinate.STDistance(i.coordinate) <= 1000 -- 1公里范围内
                    )
                    ELSE (
                        SELECT COUNT(*) 
                        FROM items i2 
                        WHERE i2.type = 'lost' 
                        AND i2.category_id = i.category_id 
                        AND i2.status = 'active'
                        AND i2.coordinate.STDistance(i.coordinate) <= 1000
                    )
                END as match_count
            FROM items i
            LEFT JOIN categories c ON i.category_id = c.id
            LEFT JOIN users u ON i.author_id = u.id
            WHERE ${whereClause}
            AND i.latitude IS NOT NULL 
            AND i.longitude IS NOT NULL
            ORDER BY i.created_at DESC
        `;

        // 热力图数据查询 - 按网格聚合
        const heatmapQuery = `
            WITH GridData AS (
                SELECT 
                    -- 创建网格，每个网格约500米x500米
                    ROUND(i.latitude / 0.0045, 0) * 0.0045 as grid_lat,
                    ROUND(i.longitude / 0.0090, 0) * 0.0090 as grid_lng,
                    COUNT(*) as item_count
                FROM items i
                WHERE ${whereClause}
                AND i.latitude IS NOT NULL 
                AND i.longitude IS NOT NULL
                AND i.created_at >= DATEADD(day, -30, GETDATE()) -- 只统计最近30天
                GROUP BY 
                    ROUND(i.latitude / 0.0045, 0) * 0.0045,
                    ROUND(i.longitude / 0.0090, 0) * 0.0090
                HAVING COUNT(*) >= 2 -- 至少2个物品才显示热力点
            )
            SELECT 
                grid_lat as latitude,
                grid_lng as longitude,
                item_count as weight
            FROM GridData
            ORDER BY item_count DESC
        `;

        // 执行查询
        const pool = await sql.connect();
        const request = pool.request();

        // 添加参数
        parameters.forEach(param => {
            request.input(param.name, param.type, param.value);
        });

        // 执行物品查询
        const itemsResult = await request.query(itemsQuery);
        
        // 重新创建请求对象执行热力图查询
        const heatmapRequest = pool.request();
        parameters.forEach(param => {
            heatmapRequest.input(param.name, param.type, param.value);
        });
        const heatmapResult = await heatmapRequest.query(heatmapQuery);

        // 处理物品数据
        const items = itemsResult.recordset.map(item => ({
            id: item.id,
            title: item.title,
            type: item.type,
            coordinates: {
                latitude: parseFloat(item.latitude),
                longitude: parseFloat(item.longitude)
            },
            location: item.location_detail,
            category: item.category_name,
            lostDate: item.lost_date,
            createdAt: item.created_at,
            status: item.status,
            viewCount: item.view_count,
            matchCount: item.match_count || 0,
            author: {
                name: item.author_name,
                avatar: item.author_avatar
            }
        }));

        // 处理热力图数据
        const heatmapData = heatmapResult.recordset.map(point => ({
            coordinates: {
                latitude: parseFloat(point.latitude),
                longitude: parseFloat(point.longitude)
            },
            weight: point.weight
        }));

        // 统计信息
        const stats = {
            totalItems: items.length,
            lostItems: items.filter(item => item.type === 'lost').length,
            foundItems: items.filter(item => item.type === 'found').length,
            heatmapPoints: heatmapData.length
        };

        return successResponse(res, {
            items,
            heatmapData,
            stats,
            bounds: {
                minLat,
                minLng,
                maxLat,
                maxLng
            }
        }, '获取地图数据成功');

    } catch (error) {
        console.error('获取地图数据失败:', error);
        return errorResponse(res, 500, '获取地图数据失败');
    }
};

/**
 * 获取地图统计信息
 * GET /map/statistics
 */
exports.getMapStatistics = async (req, res) => {
    try {
        const { timeRange = '30d' } = req.query;

        const days = {
            '7d': 7,
            '30d': 30,
            '90d': 90,
            'all': null
        }[timeRange];

        let timeCondition = '';
        if (days) {
            timeCondition = `AND created_at >= DATEADD(day, ${-days}, GETDATE())`;
        }

        const query = `
            SELECT 
                COUNT(*) as total_items,
                SUM(CASE WHEN type = 'lost' THEN 1 ELSE 0 END) as lost_items,
                SUM(CASE WHEN type = 'found' THEN 1 ELSE 0 END) as found_items,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_items,
                AVG(CASE WHEN status = 'resolved' AND resolved_at IS NOT NULL 
                    THEN DATEDIFF(hour, created_at, resolved_at) ELSE NULL END) as avg_resolve_hours,
                COUNT(DISTINCT location_id) as active_locations
            FROM items 
            WHERE latitude IS NOT NULL 
            AND longitude IS NOT NULL 
            AND status != 'deleted'
            ${timeCondition}
        `;

        const pool = await sql.connect();
        const result = await pool.request().query(query);
        const stats = result.recordset[0];

        return successResponse(res, {
            totalItems: stats.total_items || 0,
            lostItems: stats.lost_items || 0,
            foundItems: stats.found_items || 0,
            resolvedItems: stats.resolved_items || 0,
            successRate: stats.total_items > 0 ? 
                (stats.resolved_items / stats.total_items * 100).toFixed(1) : '0.0',
            avgResolveHours: stats.avg_resolve_hours ? 
                Math.round(stats.avg_resolve_hours) : null,
            activeLocations: stats.active_locations || 0,
            timeRange
        }, '获取地图统计成功');

    } catch (error) {
        console.error('获取地图统计失败:', error);
        return errorResponse(res, 500, '获取地图统计失败');
    }
};