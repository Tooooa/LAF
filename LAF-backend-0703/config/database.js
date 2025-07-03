const sql = require('mssql');

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true', // Azure需要设置为true
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 30000,
    connectionTimeout: 30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

class Database {
  constructor() {
    this.pool = null;
  }

  async connect() {
    try {
      if (!this.pool) {
        this.pool = await sql.connect(dbConfig);
        console.log('数据库连接成功');
      }
      return this.pool;
    } catch (error) {
      console.error('数据库连接失败:', error);
      throw error;
    }
  }

  async query(sqlQuery, params = {}) {
    try {
      const pool = await this.connect();
      const request = pool.request();
      
      // 添加参数
      Object.keys(params).forEach(key => {
        request.input(key, params[key]);
      });
      
      const result = await request.query(sqlQuery);
      return result;
    } catch (error) {
      console.error('数据库查询错误:', error);
      throw error;
    }
  }

  async close() {
    try {
      if (this.pool) {
        await this.pool.close();
        this.pool = null;
        console.log('数据库连接已关闭');
      }
    } catch (error) {
      console.error('关闭数据库连接时出错:', error);
    }
  }
}

const database = new Database();

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('正在关闭服务器...');
  await database.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('正在关闭服务器...');
  await database.close();
  process.exit(0);
});

module.exports = database;
