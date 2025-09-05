"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AirdropService = void 0;
const database_1 = require("@/services/database");
const logger_1 = require("@/utils/logger");
class AirdropService {
    /**
     * 获取活跃空投列表
     */
    static async getActiveAirdrops(filter = {}) {
        try {
            const { chain, status = 'Active', isHot, category, limit = 20, offset = 0 } = filter;
            const where = {
                status
            };
            if (chain)
                where.chain = chain;
            if (isHot !== undefined)
                where.isHot = isHot;
            if (category)
                where.category = category;
            const airdrops = await database_1.prisma.activeAirdrop.findMany({
                where,
                orderBy: [
                    { isHot: 'desc' },
                    { createdAt: 'desc' }
                ],
                take: limit,
                skip: offset
            });
            const total = await database_1.prisma.activeAirdrop.count({ where });
            return {
                data: airdrops,
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            };
        }
        catch (error) {
            logger_1.Logger.error('Failed to get active airdrops', { error, filter });
            throw error;
        }
    }
    /**
     * 创建活跃空投项目
     */
    static async createActiveAirdrop(data) {
        try {
            const airdropData = {
                ...data,
                tags: JSON.stringify(data.tags || [])
            };
            const airdrop = await database_1.prisma.activeAirdrop.create({
                data: airdropData
            });
            logger_1.Logger.info('Active airdrop created', { id: airdrop.id, project: airdrop.project });
            return airdrop;
        }
        catch (error) {
            logger_1.Logger.error('Failed to create active airdrop', { error, data });
            throw error;
        }
    }
    /**
     * 更新活跃空投项目
     */
    static async updateActiveAirdrop(id, data) {
        try {
            const updateData = {
                ...data
            };
            if (data.tags) {
                updateData.tags = JSON.stringify(data.tags);
            }
            const airdrop = await database_1.prisma.activeAirdrop.update({
                where: { id },
                data: updateData
            });
            logger_1.Logger.info('Active airdrop updated', { id, project: airdrop.project });
            return airdrop;
        }
        catch (error) {
            logger_1.Logger.error('Failed to update active airdrop', { error, id, data });
            throw error;
        }
    }
    /**
     * 删除活跃空投项目
     */
    static async deleteActiveAirdrop(id) {
        try {
            await database_1.prisma.activeAirdrop.delete({
                where: { id }
            });
            logger_1.Logger.info('Active airdrop deleted', { id });
            return true;
        }
        catch (error) {
            logger_1.Logger.error('Failed to delete active airdrop', { error, id });
            throw error;
        }
    }
    /**
     * 获取用户空投项目列表
     */
    static async getUserAirdropProjects(filter = {}) {
        try {
            const { userId, walletAddress, status, limit = 20, offset = 0 } = filter;
            const where = {};
            if (userId)
                where.userId = userId;
            if (walletAddress)
                where.walletAddress = walletAddress;
            if (status)
                where.status = status;
            const projects = await database_1.prisma.userAirdropProject.findMany({
                where,
                include: {
                    airdrop: true
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: limit,
                skip: offset
            });
            const total = await database_1.prisma.userAirdropProject.count({ where });
            return {
                data: projects,
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            };
        }
        catch (error) {
            logger_1.Logger.error('Failed to get user airdrop projects', { error, filter });
            throw error;
        }
    }
    /**
     * 创建用户空投项目
     */
    static async createUserAirdropProject(data) {
        try {
            const project = await database_1.prisma.userAirdropProject.create({
                data,
                include: {
                    airdrop: true
                }
            });
            logger_1.Logger.info('User airdrop project created', {
                id: project.id,
                project: project.project,
                walletAddress: project.walletAddress
            });
            return project;
        }
        catch (error) {
            logger_1.Logger.error('Failed to create user airdrop project', { error, data });
            throw error;
        }
    }
    /**
     * 更新用户空投项目
     */
    static async updateUserAirdropProject(id, data) {
        try {
            const project = await database_1.prisma.userAirdropProject.update({
                where: { id },
                data,
                include: {
                    airdrop: true
                }
            });
            logger_1.Logger.info('User airdrop project updated', {
                id,
                project: project.project,
                status: project.status
            });
            return project;
        }
        catch (error) {
            logger_1.Logger.error('Failed to update user airdrop project', { error, id, data });
            throw error;
        }
    }
    /**
     * 删除用户空投项目
     */
    static async deleteUserAirdropProject(id) {
        try {
            await database_1.prisma.userAirdropProject.delete({
                where: { id }
            });
            logger_1.Logger.info('User airdrop project deleted', { id });
            return true;
        }
        catch (error) {
            logger_1.Logger.error('Failed to delete user airdrop project', { error, id });
            throw error;
        }
    }
    /**
     * 根据钱包地址获取用户项目
     */
    static async getUserProjectsByWallet(walletAddress) {
        try {
            return await this.getUserAirdropProjects({ walletAddress });
        }
        catch (error) {
            logger_1.Logger.error('Failed to get user projects by wallet', { error, walletAddress });
            throw error;
        }
    }
    /**
     * 初始化默认活跃空投数据
     */
    static async initializeDefaultAirdrops() {
        try {
            const count = await database_1.prisma.activeAirdrop.count();
            if (count > 0) {
                logger_1.Logger.info('Active airdrops already exist, skipping initialization');
                return;
            }
            const defaultAirdrops = [
                {
                    project: "Jupiter DEX",
                    chain: "Solana",
                    deadline: "2024-12-31",
                    requirements: "交易量 $1000+, 持有 JUP",
                    estimatedValue: "$50-200",
                    category: "DeFi",
                    difficulty: "Medium",
                    tags: ["DEX", "Solana", "Trading"],
                    isHot: true,
                    description: "Jupiter是Solana生态系统中领先的DEX聚合器"
                },
                {
                    project: "Drift Protocol",
                    chain: "Solana",
                    deadline: "2024-11-30",
                    requirements: "使用永续合约交易, 提供流动性",
                    estimatedValue: "$100-500",
                    category: "DeFi",
                    difficulty: "Hard",
                    tags: ["Perpetuals", "Solana", "DeFi"],
                    isHot: true,
                    description: "Solana上的去中心化永续合约交易协议"
                },
                {
                    project: "LayerZero",
                    chain: "Ethereum",
                    deadline: "2024-10-31",
                    requirements: "跨链桥接资产, 使用多个网络",
                    estimatedValue: "$200-1000",
                    category: "Infrastructure",
                    difficulty: "Hard",
                    tags: ["Cross-chain", "Bridge", "Infrastructure"],
                    isHot: true,
                    description: "全链互操作性协议，实现跨链应用"
                },
                {
                    project: "Marginfi",
                    chain: "Solana",
                    deadline: "2024-12-15",
                    requirements: "借贷操作, 质押资产",
                    estimatedValue: "$30-150",
                    category: "DeFi",
                    difficulty: "Medium",
                    tags: ["Lending", "Solana", "DeFi"],
                    isHot: false,
                    description: "Solana上的去中心化借贷协议"
                }
            ];
            for (const airdropData of defaultAirdrops) {
                await this.createActiveAirdrop(airdropData);
            }
            logger_1.Logger.info('Default active airdrops initialized', { count: defaultAirdrops.length });
        }
        catch (error) {
            logger_1.Logger.error('Failed to initialize default airdrops', { error });
            throw error;
        }
    }
}
exports.AirdropService = AirdropService;
//# sourceMappingURL=airdrop.service.js.map