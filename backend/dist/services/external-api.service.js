"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalApiService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("@/utils/logger");
const database_1 = require("@/services/database");
const websocket_service_1 = require("@/services/websocket.service");
class ExternalApiService {
    static async processQueue() {
        if (this.requestQueue.length === 0 || this.activeRequests >= this.API_RATE_LIMIT) {
            return;
        }
        const { requestFn, resolve, reject } = this.requestQueue.shift();
        this.activeRequests++;
        try {
            const result = await requestFn();
            resolve(result);
        }
        catch (error) {
            reject(error);
        }
        finally {
            this.activeRequests--;
            // 添加延迟再处理下一个请求
            setTimeout(() => {
                this.processQueue();
            }, this.API_DELAY);
        }
    }
    /**
     * 受限流控制的API请求
     */
    static async throttledRequest(requestFn) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({ requestFn, resolve, reject });
            this.processQueue();
        });
    }
    /**
     * Retry mechanism for API calls
     */
    static async makeRequestWithRetry(requestFn, operation, maxRetries = this.MAX_RETRIES) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
            try {
                // 使用节流请求而不是直接调用
                return await this.throttledRequest(requestFn);
            }
            catch (error) {
                lastError = error;
                logger_1.Logger.warn(`API request failed (attempt ${attempt}/${maxRetries + 1})`, {
                    operation,
                    error: error.message,
                    status: error.response?.status
                });
                // 如果是429错误，增加额外延迟
                if (error.response?.status === 429) {
                    const retryAfter = parseInt(error.response.headers?.['retry-after'] || '5');
                    const delay = Math.max(retryAfter * 1000, 5000); // 至少5秒
                    logger_1.Logger.warn(`Rate limited, waiting ${delay}ms before retry`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                // If it's the last attempt, throw the error
                if (attempt === maxRetries + 1) {
                    throw lastError;
                }
                // Wait before retrying (exponential backoff)
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw lastError;
    }
    /**
     * Query Filecoin miner earnings
     */
    static async queryFilecoinMinerEarnings(minerId, duration = '24h') {
        try {
            logger_1.Logger.info('Querying Filecoin miner earnings', { minerId, duration });
            const response = await this.makeRequestWithRetry(() => axios_1.default.get(`${this.FILECOIN_API_BASE}/address/${minerId}/mining-stats`, {
                timeout: this.REQUEST_TIMEOUT,
                params: { duration }
            }), `Filecoin earnings query for ${minerId}`);
            if (!response.data) {
                logger_1.Logger.warn('No mining stats found for Filecoin miner', { minerId });
                return null;
            }
            const stats = response.data;
            // Convert attoFIL to FIL (1 FIL = 10^18 attoFIL)
            const totalRewards = BigInt(stats.totalRewards || '0');
            const filRewards = Number(totalRewards) / 1e18;
            // Calculate daily average based on duration
            let dailyRewards = filRewards;
            if (duration === '7d') {
                dailyRewards = filRewards / 7;
            }
            else if (duration === '30d') {
                dailyRewards = filRewards / 30;
            }
            logger_1.Logger.info('Filecoin miner earnings retrieved', {
                minerId,
                duration,
                totalRewards: stats.totalRewards,
                filRewards: filRewards.toFixed(6),
                dailyRewards: dailyRewards.toFixed(6)
            });
            return {
                daily: dailyRewards,
                total: filRewards
            };
        }
        catch (error) {
            logger_1.Logger.error('Error querying Filecoin miner earnings', {
                error: error.message,
                minerId,
                status: error.response?.status
            });
            return null;
        }
    }
    /**
     * Query Filecoin miner power/capacity
     */
    static async queryFilecoinMinerCapacity(minerId) {
        try {
            logger_1.Logger.info('Querying Filecoin miner capacity', { minerId });
            const response = await this.makeRequestWithRetry(() => axios_1.default.get(`${this.FILECOIN_API_BASE}/address/${minerId}/power-stats`, { timeout: this.REQUEST_TIMEOUT }), `Filecoin capacity query for ${minerId}`);
            if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
                logger_1.Logger.warn('No power stats found for Filecoin miner', { minerId });
                return null;
            }
            // Get the latest power stats
            const latestStats = response.data[response.data.length - 1];
            const qualityAdjPower = BigInt(latestStats.qualityAdjPower);
            if (qualityAdjPower <= 0) {
                logger_1.Logger.warn('Filecoin miner has no effective power', { minerId, qualityAdjPower: latestStats.qualityAdjPower });
                return '0 TiB';
            }
            // Convert bytes to TiB (1 TiB = 1099511627776 bytes)
            const tib = Number(qualityAdjPower) / 1099511627776;
            // Format as PiB if >= 1000 TiB, otherwise TiB
            let capacityDisplay;
            if (tib >= 1000) {
                const pib = tib / 1024;
                capacityDisplay = `${pib.toFixed(2)} PiB`;
            }
            else {
                capacityDisplay = `${tib.toFixed(2)} TiB`;
            }
            logger_1.Logger.info('Filecoin miner capacity retrieved', {
                minerId,
                qualityAdjPower: latestStats.qualityAdjPower,
                rawBytePower: latestStats.rawBytePower,
                tib: tib.toFixed(2),
                capacityDisplay,
                calculationDetails: `${latestStats.qualityAdjPower} bytes = ${capacityDisplay}`
            });
            return capacityDisplay;
        }
        catch (error) {
            logger_1.Logger.error('Error querying Filecoin miner capacity', {
                error: error.message,
                minerId,
                status: error.response?.status,
                statusText: error.response?.statusText
            });
            return null;
        }
    }
    /**
     * Query Helium hotspot information
     */
    static async queryHeliumHotspotInfo(hotspotAddress) {
        try {
            logger_1.Logger.info('Querying Helium hotspot info', { hotspotAddress });
            const response = await this.makeRequestWithRetry(() => axios_1.default.get(`${this.HELIUM_API_BASE}/hotspots/${hotspotAddress}`, { timeout: this.REQUEST_TIMEOUT }), `Helium hotspot query for ${hotspotAddress}`);
            const hotspot = response.data.data;
            if (!hotspot) {
                logger_1.Logger.warn('Helium hotspot not found', { hotspotAddress });
                return { capacity: null, status: null, location: null };
            }
            const status = hotspot.status?.online === 'online' ? 'ONLINE' : 'OFFLINE';
            const location = hotspot.lat && hotspot.lng
                ? `${hotspot.lat.toFixed(6)}, ${hotspot.lng.toFixed(6)}`
                : null;
            // Helium hotspots don't have traditional "capacity", but we can use reward scale as indicator
            const capacity = `Reward Scale: ${(hotspot.reward_scale || 0).toFixed(2)}`;
            logger_1.Logger.info('Helium hotspot info retrieved', {
                hotspotAddress,
                status,
                location,
                capacity
            });
            return { capacity, status, location };
        }
        catch (error) {
            logger_1.Logger.error('Error querying Helium hotspot info', {
                error: error.message,
                hotspotAddress,
                status: error.response?.status
            });
            return { capacity: null, status: null, location: null };
        }
    }
    /**
     * Generic capacity query based on project type and node ID
     */
    static async queryNodeCapacity(projectName, nodeId) {
        const normalizedProject = projectName.toLowerCase();
        try {
            // Route to appropriate API based on project
            if (normalizedProject.includes('filecoin')) {
                const capacity = await this.queryFilecoinMinerCapacity(nodeId);
                return { capacity };
            }
            if (normalizedProject.includes('helium')) {
                return await this.queryHeliumHotspotInfo(nodeId);
            }
            // For other projects, simulate capacity query
            logger_1.Logger.info('Simulating capacity query for unknown project', { projectName, nodeId });
            // Simulate realistic API delay
            await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
            // Generate mock capacity based on project type
            let mockCapacity;
            if (normalizedProject.includes('storage')) {
                const tib = Math.floor(Math.random() * 100) + 10;
                mockCapacity = `${tib} TiB`;
            }
            else if (normalizedProject.includes('computing')) {
                const gpu = Math.floor(Math.random() * 8) + 1;
                mockCapacity = `${gpu} GPU${gpu > 1 ? 's' : ''}`;
            }
            else if (normalizedProject.includes('wireless')) {
                mockCapacity = 'Coverage: Active';
            }
            else if (normalizedProject.includes('sensor')) {
                mockCapacity = 'Data Collection: Active';
            }
            else {
                mockCapacity = 'Active';
            }
            logger_1.Logger.info('Mock capacity generated', { projectName, nodeId, mockCapacity });
            return {
                capacity: mockCapacity,
                status: 'ONLINE'
            };
        }
        catch (error) {
            logger_1.Logger.error('Error in generic capacity query', {
                error: error.message,
                projectName,
                nodeId
            });
            return { capacity: null };
        }
    }
    /**
     * Batch update node capacities for nodes without capacity
     */
    static async updateNodeCapacities(userId) {
        try {
            logger_1.Logger.info('Starting batch node capacity update', { userId });
            // Find nodes without capacity OR Filecoin nodes (for earnings update)
            const where = {
                OR: [
                    { capacity: null },
                    { capacity: '' },
                    { capacity: 'Querying...' }
                ]
            };
            if (userId) {
                where.userId = userId;
            }
            // Get nodes without capacity
            const capacityNodes = await database_1.prisma.userNode.findMany({
                where,
                include: {
                    project: {
                        select: {
                            name: true,
                            blockchain: true
                        }
                    }
                },
                take: 25 // Limit batch size
            });
            // Also get all Filecoin nodes for earnings update, regardless of capacity status
            const filecoinWhere = userId ? { userId } : {};
            const filecoinNodes = await database_1.prisma.userNode.findMany({
                where: {
                    ...filecoinWhere,
                    project: {
                        name: {
                            contains: 'Filecoin'
                        }
                    }
                },
                include: {
                    project: {
                        select: {
                            name: true,
                            blockchain: true
                        }
                    }
                }
            });
            // Combine and deduplicate nodes
            const allNodesMap = new Map();
            [...capacityNodes, ...filecoinNodes].forEach(node => {
                allNodesMap.set(node.id, node);
            });
            const nodes = Array.from(allNodesMap.values());
            logger_1.Logger.info(`Found ${nodes.length} nodes to update (${capacityNodes.length} for capacity, ${filecoinNodes.length} Filecoin nodes for earnings)`);
            const results = [];
            let updated = 0;
            let failed = 0;
            for (const node of nodes) {
                try {
                    const { capacity, status, location } = await this.queryNodeCapacity(node.project.name, node.nodeId);
                    if (capacity) {
                        // Update node with new capacity data
                        const updateData = { capacity };
                        if (status) {
                            updateData.status = status;
                        }
                        if (location && !node.location) {
                            updateData.location = location;
                        }
                        // Query earnings for Filecoin miners and set monitor URL
                        if (node.project.name.toLowerCase().includes('filecoin')) {
                            // Set monitor URL if not already set
                            if (!node.monitorUrl && node.nodeId.startsWith('f0')) {
                                updateData.monitorUrl = `https://filfox.info/zh/address/${node.nodeId}`;
                            }
                            const earnings = await this.queryFilecoinMinerEarnings(node.nodeId, '24h');
                            if (earnings) {
                                updateData.earnings = `${earnings.daily.toFixed(2)} FIL/day`;
                                updateData.totalEarned = (node.totalEarned || 0) + earnings.daily;
                                logger_1.Logger.info('Updated Filecoin miner earnings in batch', {
                                    nodeId: node.nodeId,
                                    dailyEarnings: earnings.daily.toFixed(6),
                                    totalEarnings: earnings.total.toFixed(6)
                                });
                            }
                        }
                        await database_1.prisma.userNode.update({
                            where: { id: node.id },
                            data: updateData
                        });
                        results.push({
                            nodeId: node.nodeId,
                            success: true,
                            capacity
                        });
                        updated++;
                        logger_1.Logger.info('Node capacity updated', {
                            nodeId: node.nodeId,
                            capacity,
                            userId: node.userId
                        });
                    }
                    else {
                        results.push({
                            nodeId: node.nodeId,
                            success: false,
                            error: 'Could not retrieve capacity'
                        });
                        failed++;
                    }
                    // Reduced delay between requests for better performance
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
                catch (error) {
                    logger_1.Logger.error('Failed to update node capacity', {
                        error: error.message,
                        nodeId: node.nodeId,
                        userId: node.userId
                    });
                    results.push({
                        nodeId: node.nodeId,
                        success: false,
                        error: error.message
                    });
                    failed++;
                }
            }
            logger_1.Logger.info('Batch capacity update completed', {
                total: nodes.length,
                updated,
                failed,
                userId
            });
            return { updated, failed, details: results };
        }
        catch (error) {
            logger_1.Logger.error('Error in batch capacity update', {
                error: error.message,
                userId
            });
            return { updated: 0, failed: 0, details: [] };
        }
    }
    /**
     * Update capacity for a specific node
     */
    static async updateSingleNodeCapacity(nodeId, userId) {
        try {
            const node = await database_1.prisma.userNode.findFirst({
                where: { id: nodeId, userId },
                include: {
                    project: {
                        select: { name: true }
                    }
                }
            });
            if (!node) {
                logger_1.Logger.warn('Node not found for capacity update', { nodeId, userId });
                return false;
            }
            const { capacity, status, location } = await this.queryNodeCapacity(node.project.name, node.nodeId);
            if (!capacity) {
                logger_1.Logger.warn('Could not retrieve capacity for node', { nodeId: node.nodeId });
                return false;
            }
            const updateData = { capacity };
            if (status) {
                updateData.status = status;
            }
            if (location && !node.location) {
                updateData.location = location;
            }
            // Query earnings for Filecoin miners and set monitor URL
            if (node.project.name.toLowerCase().includes('filecoin')) {
                // Set monitor URL if not already set
                if (!node.monitorUrl && node.nodeId.startsWith('f0')) {
                    updateData.monitorUrl = `https://filfox.info/zh/address/${node.nodeId}`;
                }
                const earnings = await this.queryFilecoinMinerEarnings(node.nodeId, '24h');
                if (earnings) {
                    updateData.earnings = `${earnings.daily.toFixed(2)} FIL/day`;
                    updateData.totalEarned = (node.totalEarned || 0) + earnings.daily;
                    logger_1.Logger.info('Updated Filecoin miner earnings', {
                        nodeId: node.nodeId,
                        dailyEarnings: earnings.daily.toFixed(6),
                        totalEarnings: earnings.total.toFixed(6)
                    });
                }
            }
            await database_1.prisma.userNode.update({
                where: { id: nodeId },
                data: updateData
            });
            logger_1.Logger.info('Single node capacity updated', {
                nodeId: node.nodeId,
                capacity,
                userId
            });
            // Send WebSocket notification for real-time update
            websocket_service_1.WebSocketService.notifyCapacityUpdate(userId, node.nodeId, capacity);
            // Send earnings update if available
            if (updateData.earnings !== undefined) {
                websocket_service_1.WebSocketService.notifyEarningsUpdate(userId, {
                    nodeId: node.nodeId,
                    dailyEarnings: updateData.earnings,
                    totalEarned: updateData.totalEarned
                });
            }
            return true;
        }
        catch (error) {
            logger_1.Logger.error('Error updating single node capacity', {
                error: error.message,
                nodeId,
                userId
            });
            return false;
        }
    }
}
exports.ExternalApiService = ExternalApiService;
ExternalApiService.FILECOIN_API_BASE = 'https://filfox.info/api/v1';
ExternalApiService.HELIUM_API_BASE = 'https://api.helium.io/v1';
ExternalApiService.REQUEST_TIMEOUT = 5000; // Reduced to 5 seconds
ExternalApiService.MAX_RETRIES = 2; // Add retry mechanism
ExternalApiService.API_RATE_LIMIT = 2; // 最大并发API请求数
ExternalApiService.API_DELAY = 1000; // API请求间隔（毫秒）
/**
 * 简单的并发控制队列
 */
ExternalApiService.activeRequests = 0;
ExternalApiService.requestQueue = [];
//# sourceMappingURL=external-api.service.js.map