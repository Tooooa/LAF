const database = require('../config/database');
const sql = require('mssql');

class Location {
  // 获取地点建议（自动补全）
  static async getSuggestions(query, type = 'all', limit = 20) {
        // ======================= 在这里添加诊断日志 =======================
    console.log(`[DEBUG] In Location.getSuggestions method:`);
    console.log(`  - Received limit parameter:`, limit);
    console.log(`  - Type of limit:`, typeof limit);
    // ===============================================================
    try {
      let whereClause = 'WHERE is_active = 1';
      const params = { limit };

      if (query && query.trim()) {
        whereClause += ` AND (name LIKE @query OR full_name LIKE @query)`;
        params.query = `%${query.trim()}%`;
      }

      if (type && type !== 'all') {
        whereClause += ` AND type = @type`;
        params.type = type;
      }

      const sqlQuery = `
        SELECT TOP (@limit)
          id,
          name,
          full_name,
          type,
          parent_id,
          latitude,
          longitude,
          floors,
          description,
          sort_order
        FROM locations
        ${whereClause}
        ORDER BY sort_order ASC, name ASC
      `;

      const result = await database.query(sqlQuery, params);
      
      return result.recordset.map(row => ({
        id: row.id,
        name: row.name,
        fullName: row.full_name,
        type: row.type,
        parentId: row.parent_id,
        coordinates: row.latitude && row.longitude ? {
          latitude: parseFloat(row.latitude),
          longitude: parseFloat(row.longitude)
        } : null,
        floors: row.floors ? JSON.parse(row.floors) : null,
        description: row.description,
        sortOrder: row.sort_order
      }));
    } catch (error) {
      console.error('获取地点建议时出错:', error);
      throw error;
    }
  }

  // 根据ID获取地点详情
  static async getById(id) {
    try {
      const sqlQuery = `
        SELECT 
          id,
          name,
          full_name,
          type,
          parent_id,
          latitude,
          longitude,
          floors,
          description,
          is_active,
          sort_order,
          created_at,
          updated_at
        FROM locations
        WHERE id = @id AND is_active = 1
      `;

      const result = await database.query(sqlQuery, { id });
      
      if (result.recordset.length === 0) {
        return null;
      }

      const row = result.recordset[0];
      return {
        id: row.id,
        name: row.name,
        fullName: row.full_name,
        type: row.type,
        parentId: row.parent_id,
        coordinates: row.latitude && row.longitude ? {
          latitude: parseFloat(row.latitude),
          longitude: parseFloat(row.longitude)
        } : null,
        floors: row.floors ? JSON.parse(row.floors) : null,
        description: row.description,
        isActive: row.is_active,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('根据ID获取地点时出错:', error);
      throw error;
    }
  }

  // 获取子地点
  static async getChildren(parentId, limit = 50) {
    try {
      const sqlQuery = `
        SELECT TOP (@limit)
          id,
          name,
          full_name,
          type,
          latitude,
          longitude,
          floors,
          description,
          sort_order
        FROM locations
        WHERE parent_id = @parentId AND is_active = 1
        ORDER BY sort_order ASC, name ASC
      `;

      const result = await database.query(sqlQuery, { parentId, limit });
      
      return result.recordset.map(row => ({
        id: row.id,
        name: row.name,
        fullName: row.full_name,
        type: row.type,
        coordinates: row.latitude && row.longitude ? {
          latitude: parseFloat(row.latitude),
          longitude: parseFloat(row.longitude)
        } : null,
        floors: row.floors ? JSON.parse(row.floors) : null,
        description: row.description,
        sortOrder: row.sort_order
      }));
    } catch (error) {
      console.error('获取子地点时出错:', error);
      throw error;
    }
  }

  // 获取热门地点（基于使用频率）
  static async getPopularLocations(limit = 10) {
    try {
      // 这里假设有一个items表记录物品信息，location字段存储地点名称
      // 如果没有items表，可以返回排序靠前的地点
      const sqlQuery = `
        SELECT TOP (@limit)
          id,
          name,
          full_name,
          type,
          latitude,
          longitude,
          floors,
          description
        FROM locations
        WHERE is_active = 1
        ORDER BY sort_order ASC, name ASC
      `;

      const result = await database.query(sqlQuery, { limit });
      
      return result.recordset.map(row => ({
        id: row.id,
        name: row.name,
        fullName: row.full_name,
        type: row.type,
        coordinates: row.latitude && row.longitude ? {
          latitude: parseFloat(row.latitude),
          longitude: parseFloat(row.longitude)
        } : null,
        floors: row.floors ? JSON.parse(row.floors) : null,
        description: row.description
      }));
    } catch (error) {
      console.error('获取热门地点时出错:', error);
      throw error;
    }
  }
}

module.exports = Location;