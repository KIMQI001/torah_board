"use strict";
/**
 * Daily Rewards Service - 每日奖励记录服务
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyRewardsService = void 0;
const client_1 = require("@prisma/client");
// Note: We'll call the price service from frontend since it's already implemented there
// This is a placeholder - in production you'd want to implement a backend price service
const prisma = new client_1.PrismaClient();
class DailyRewardsService {
    /**
     * 记录当日所有用户的奖励到数据库
     */
    static async recordDailyRewards() {
        try {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 格式
            console.log(`📅 开始记录 ${today} 的每日奖励...`);
            // 获取所有用户
            const users = await prisma.user.findMany({
                include: {
                    nodes: {
                        include: {
                            project: true
                        }
                    }
                }
            });
            let processedUsers = 0;
            let totalRecords = 0;
            for (const user of users) {
                try {
                    // 跳过没有节点的用户
                    if (user.nodes.length === 0) {
                        continue;
                    }
                    // 计算用户当日总奖励
                    const rewardsResult = await this.calculateUserDailyRewards(user.nodes);
                    if (rewardsResult.totalRewardsUSD > 0) {
                        // 保存或更新每日奖励记录
                        await prisma.dailyReward.upsert({
                            where: {
                                userId_date: {
                                    userId: user.id,
                                    date: today
                                }
                            },
                            update: {
                                totalRewardsUSD: rewardsResult.totalRewardsUSD,
                                breakdown: JSON.stringify(rewardsResult.breakdown),
                                nodeCount: rewardsResult.nodeCount,
                                updatedAt: new Date()
                            },
                            create: {
                                userId: user.id,
                                date: today,
                                totalRewardsUSD: rewardsResult.totalRewardsUSD,
                                breakdown: JSON.stringify(rewardsResult.breakdown),
                                nodeCount: rewardsResult.nodeCount
                            }
                        });
                        totalRecords++;
                    }
                    processedUsers++;
                }
                catch (userError) {
                    console.error(`❌ 处理用户 ${user.id} 的奖励记录时出错:`, userError);
                }
            }
            console.log(`✅ 每日奖励记录完成: 处理了 ${processedUsers} 个用户，记录了 ${totalRecords} 条奖励数据`);
        }
        catch (error) {
            console.error('❌ 记录每日奖励时出错:', error);
            throw error;
        }
    }
    /**
     * 计算用户当日总奖励
     */
    static async calculateUserDailyRewards(nodes) {
        // 获取所有涉及的代币符号
        const tokenSymbols = Array.from(new Set(nodes.map(node => {
            const match = node.earnings.match(/^[\d.]+\s*(\w+)/);
            return match ? match[1] : null;
        }).filter(Boolean)));
        // 获取代币价格
        const tokenPrices = tokenSymbols.length > 0 ?
            await this.getTokenPrices(tokenSymbols) : {};
        let totalRewardsUSD = 0;
        const breakdown = {};
        let nodeCount = 0;
        // 计算每个节点的奖励
        for (const node of nodes) {
            // 只统计在线节点
            if (node.status !== 'online')
                continue;
            const match = node.earnings.match(/^([\d.]+)\s*(\w+)/);
            if (!match)
                continue;
            const dailyAmount = parseFloat(match[1]);
            const tokenSymbol = match[2];
            const tokenPrice = tokenPrices[tokenSymbol] || 0;
            const usdValue = dailyAmount * tokenPrice;
            // 累加到breakdown
            if (!breakdown[tokenSymbol]) {
                breakdown[tokenSymbol] = { amount: 0, price: tokenPrice, usd: 0 };
            }
            breakdown[tokenSymbol].amount += dailyAmount;
            breakdown[tokenSymbol].usd += usdValue;
            totalRewardsUSD += usdValue;
            nodeCount++;
        }
        return {
            totalRewardsUSD,
            breakdown,
            nodeCount
        };
    }
    /**
     * 获取用户过去N天的奖励记录
     */
    static async getUserRewardsHistory(userId, days = 7) {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - days);
            const rewards = await prisma.dailyReward.findMany({
                where: {
                    userId,
                    date: {
                        gte: startDate.toISOString().split('T')[0],
                        lte: endDate.toISOString().split('T')[0]
                    }
                },
                orderBy: {
                    date: 'desc'
                }
            });
            return rewards.map(reward => ({
                ...reward,
                breakdown: JSON.parse(reward.breakdown)
            }));
        }
        catch (error) {
            console.error('❌ 获取用户奖励历史时出错:', error);
            return [];
        }
    }
    /**
     * 计算用户过去N天的总奖励（滚动窗口）
     */
    static async calculateRollingRewards(userId, days = 7) {
        try {
            const rewards = await this.getUserRewardsHistory(userId, days);
            let totalUSD = 0;
            const breakdown = {};
            for (const reward of rewards) {
                totalUSD += reward.totalRewardsUSD;
                // 合并breakdown
                Object.entries(reward.breakdown).forEach(([token, data]) => {
                    if (!breakdown[token]) {
                        breakdown[token] = { amount: 0, usd: 0 };
                    }
                    breakdown[token].amount += data.amount;
                    breakdown[token].usd += data.usd;
                });
            }
            return {
                totalUSD,
                breakdown,
                averageDaily: totalUSD / Math.max(1, days)
            };
        }
        catch (error) {
            console.error('❌ 计算滚动奖励时出错:', error);
            return {
                totalUSD: 0,
                breakdown: {},
                averageDaily: 0
            };
        }
    }
    /**
     * 清理旧的奖励记录（保留指定天数）
     */
    static async cleanupOldRewards(keepDays = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - keepDays);
            const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
            const deleted = await prisma.dailyReward.deleteMany({
                where: {
                    date: {
                        lt: cutoffDateStr
                    }
                }
            });
            console.log(`🧹 清理了 ${deleted.count} 条旧的奖励记录（${keepDays} 天前）`);
        }
        catch (error) {
            console.error('❌ 清理旧奖励记录时出错:', error);
        }
    }
    /**
     * 获取代币价格 (使用CoinGecko API)
     */
    static async getTokenPrices(symbols) {
        try {
            // Token symbol to CoinGecko ID mapping
            const tokenMap = {
                'FIL': 'filecoin',
                'HNT': 'helium',
                'RNDR': 'render-token',
                'AR': 'arweave',
                'STORJ': 'storj',
                'SC': 'siacoin',
                'THETA': 'theta-token',
                'TFUEL': 'theta-fuel',
                'IOTX': 'iotex',
                'DBC': 'deepbrain-chain',
                'GPU': 'gpu-coin',
                'AKASH': 'akash-network',
                'AKT': 'akash-network',
                'FLUX': 'zelcash',
                'TAO': 'bittensor',
                'DIMO': 'dimo',
                'MOBILE': 'helium-mobile',
                'IOT': 'helium-iot'
            };
            const coinIds = symbols.map(symbol => tokenMap[symbol.toUpperCase()] || symbol.toLowerCase());
            const idsParam = coinIds.join(',');
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd`, {
                headers: {
                    'Accept': 'application/json',
                },
                signal: AbortSignal.timeout(5000)
            });
            if (!response.ok) {
                console.warn(`Failed to fetch prices: ${response.status}`);
                return {};
            }
            const data = await response.json();
            const prices = {};
            symbols.forEach((symbol, index) => {
                const coinId = coinIds[index];
                const priceData = data[coinId];
                if (priceData && typeof priceData.usd === 'number') {
                    prices[symbol.toUpperCase()] = priceData.usd;
                }
                else {
                    prices[symbol.toUpperCase()] = 0;
                }
            });
            return prices;
        }
        catch (error) {
            console.error('Error fetching token prices:', error);
            return {};
        }
    }
}
exports.DailyRewardsService = DailyRewardsService;
//# sourceMappingURL=daily-rewards.service.js.map