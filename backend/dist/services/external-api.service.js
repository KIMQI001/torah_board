"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalApiService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("@/utils/logger");
const database_1 = require("@/services/database");
class ExternalApiService {
    /**
     * Query Filecoin miner power/capacity
     */
    static async queryFilecoinMinerCapacity(minerId) {
        try {
            logger_1.Logger.info('Querying Filecoin miner capacity', { minerId });
            const response = await axios_1.default.get(`${this.FILECOIN_API_BASE}/address/${minerId}/power-stats`, { timeout: this.REQUEST_TIMEOUT });
            if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
                logger_1.Logger.warn('No power stats found for Filecoin miner', { minerId });
                return null;
            }
            // Get the latest power stats
            const latestStats = response.data[response.data.length - 1];
            const rawBytePower = BigInt(latestStats.rawBytePower);
            if (rawBytePower <= 0) {
                logger_1.Logger.warn('Filecoin miner has no power', { minerId, rawBytePower: latestStats.rawBytePower });
                return '0 TiB';
            }
            // Convert bytes to TiB (1 TiB = 1099511627776 bytes)
            const tib = Number(rawBytePower) / 1099511627776;
            logger_1.Logger.info('Filecoin miner capacity retrieved', {
                minerId,
                rawBytePower: latestStats.rawBytePower,
                tib: tib.toFixed(2)
            });
            return `${tib.toFixed(2)} TiB`;
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
            const response = await axios_1.default.get(`${this.HELIUM_API_BASE}/hotspots/${hotspotAddress}`, { timeout: this.REQUEST_TIMEOUT });
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
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
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
            // Find nodes without capacity
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
            const nodes = await database_1.prisma.userNode.findMany({
                where,
                include: {
                    project: {
                        select: {
                            name: true,
                            blockchain: true
                        }
                    }
                },
                take: 50 // Limit batch size to prevent overwhelming external APIs
            });
            logger_1.Logger.info(`Found ${nodes.length} nodes to update capacities`);
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
                    // Add delay between requests to be respectful to APIs
                    await new Promise(resolve => setTimeout(resolve, 500));
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
            await database_1.prisma.userNode.update({
                where: { id: nodeId },
                data: updateData
            });
            logger_1.Logger.info('Single node capacity updated', {
                nodeId: node.nodeId,
                capacity,
                userId
            });
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
ExternalApiService.REQUEST_TIMEOUT = 10000; // 10 seconds
//# sourceMappingURL=external-api.service.js.map