const express = require('express');
const router = express.Router();

// --- 1. 定义需要被过滤掉的词 ---

/**
 * 基础停用词 (比如 '的', '了', '一个')
 * 这些词语本身没有实际意义。
 * @type {string[]}
 */
const SIMPLE_STOP_WORDS = [
    '的', '了', '一个', '我的', '我在', '我', '在', '附近', 
    '丢了', '丢失', '捡到', '捡了', '是', '和', '有', '吗', 
    '请问', '寻找', '我想', '一个'
];

/**
 * 颜色词
 * 颜色通常作为描述性定语，我们可以选择在初次搜索时忽略它，
 * 让用户后续通过筛选器精确查找。
 * @type {string[]}
 */
const COLOR_WORDS = [
    '红色', '蓝色', '绿色', '黄色', '紫色', '橙色', '粉色', '棕色',
    '黑色', '白色', '灰色', '银色', '金色'
];

// 将所有需要过滤的词合并到一个数组中，方便处理
const ALL_FILTER_WORDS = [...SIMPLE_STOP_WORDS, ...COLOR_WORDS];

// 动态创建一个正则表达式，用于一次性匹配所有需要过滤的词
// 例如，它会生成 /的|了|一个|红色|黑色/g 这样的模式
// 'g' 标志表示全局匹配（替换所有匹配项，而不仅仅是第一个）
const filterRegex = new RegExp(ALL_FILTER_WORDS.join('|'), 'g');


// --- 2. 简化的核心解析函数 ---

/**
 * 使用“移除+分割”的简单方式解析查询字符串
 * @param {string} query - 用户输入的原始查询字符串
 * @returns {string[]} - 解析出的关键词数组
 */
function simpleParse(query) {
    console.log(`[DEBUG] 原始查询: "${query}"`);

    // 步骤 1: 使用正则表达式，将所有在 ALL_FILTER_WORDS 列表中的词替换为空字符串
    const cleanedQuery = query.replace(filterRegex, ' '); // 替换为空格，避免单词粘连
    console.log(`[DEBUG] 移除过滤词后: "${cleanedQuery}"`);

    // 步骤 2: 将清理后的字符串按一个或多个空格进行分割，并清理结果
    const keywords = cleanedQuery
        .split(/\s+/) // 按一个或多个空白字符分割
        .map(word => word.trim()) // 去除每个词条两边的多余空格
        .filter(word => word.length > 0); // 过滤掉因替换和分割产生的空字符串

    console.log(`[DEBUG] 最终提取的关键词:`, keywords);
    return keywords;
}


// --- 3. API 路由处理函数 ---

async function handleIntelligentParse(req, res) {
    console.log('[DEBUG] 接收到 POST /intelligent-parse 请求');
    
    try {
        const { query } = req.body;

        if (!query || typeof query !== 'string' || query.trim() === '') {
            return res.status(400).json({
                success: false, code: 400, message: '查询内容不能为空'
            });
        }

        // 调用我们新的、简单的解析函数
        const extractedKeywords = simpleParse(query);

        // 构建响应数据。注意：现在没有 suggestedCategory 和 suggestedLocation 了
        const responseData = {
            filters: {
                extractedKeywords: extractedKeywords,
                // 为了保持API结构兼容性，将其他字段设为null
                suggestedCategory: null,
                suggestedLocation: null,
            }
        };

        res.status(200).json({
            success: true, code: 200, message: '解析成功', data: responseData
        });

    } catch (error) {
        console.error('[DEBUG] 智能解析时发生未知错误:', error);
        res.status(500).json({
            success: false, code: 500, message: '服务器内部错误'
        });
    }
}


// --- 4. 注册路由 ---

// 将处理函数绑定到 POST / 路径
// 当主应用以 app.use('/api/intelligent-parse', ...) 挂载时，
// 这个路由会响应对 /api/intelligent-parse 的POST请求。
router.post('/', handleIntelligentParse);


// --- 5. 导出路由模块 ---
module.exports = router;