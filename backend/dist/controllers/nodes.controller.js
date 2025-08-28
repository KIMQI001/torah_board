"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodesController = void 0;
const response_1 = require("@/utils/response");
const logger_1 = require("@/utils/logger");
const database_1 = require("@/services/database");
const external_api_service_1 = require("@/services/external-api.service");
class NodesController {
    /**
     * Get all user nodes with optional filtering and pagination
     */
    static async getUserNodes(req, res) {
        try {
            if (!req.user) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            const { page = 1, limit = 20, status, projectId, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
            // Build where clause for filtering
            const where = {
                userId: req.user.id
            };
            if (status) {
                where.status = status;
            }
            if (projectId) {
                where.projectId = projectId;
            }
            // Get total count for pagination
            const total = await database_1.prisma.userNode.count({ where });
            // Get nodes with pagination and project info
            const nodes = await database_1.prisma.userNode.findMany({
                where,
                orderBy: {
                    [sortBy]: sortOrder
                },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
                include: {
                    project: {
                        select: {
                            id: true,
                            name: true,
                            category: true,
                            blockchain: true
                        }
                    }
                }
            });
            // Transform response to match frontend expectations
            const transformedNodes = nodes.map(node => ({
                id: node.id,
                network: node.project.name,
                nodeId: node.nodeId,
                type: node.type,
                capacity: node.capacity || 'Querying...',
                earnings: node.earnings,
                status: node.status.toLowerCase(),
                uptime: node.uptime,
                location: node.location,
                startDate: node.startDate.toISOString().split('T')[0],
                totalEarned: node.totalEarned,
                hardware: node.hardware ? JSON.parse(node.hardware) : [],
                monitorUrl: node.monitorUrl,
                project: node.project,
                createdAt: node.createdAt,
                updatedAt: node.updatedAt
            }));
            response_1.ResponseUtil.paginated(res, transformedNodes, {
                page: Number(page),
                limit: Number(limit),
                total
            }, 'Nodes retrieved successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error getting user nodes', {
                error: error.message,
                userId: req.user?.id
            });
            response_1.ResponseUtil.serverError(res);
        }
    }
    /**
     * Get a single node by ID
     */
    static async getNode(req, res) {
        try {
            if (!req.user) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            const { id } = req.params;
            const node = await database_1.prisma.userNode.findFirst({
                where: {
                    id,
                    userId: req.user.id // Ensure user can only access their own nodes
                },
                include: {
                    project: true,
                    performances: {
                        orderBy: {
                            timestamp: 'desc'
                        },
                        take: 1 // Latest performance data
                    }
                }
            });
            if (!node) {
                response_1.ResponseUtil.notFound(res, 'Node not found');
                return;
            }
            const transformedNode = {
                id: node.id,
                network: node.project.name,
                nodeId: node.nodeId,
                type: node.type,
                capacity: node.capacity || 'Querying...',
                earnings: node.earnings,
                status: node.status.toLowerCase(),
                uptime: node.uptime,
                location: node.location,
                startDate: node.startDate.toISOString().split('T')[0],
                totalEarned: node.totalEarned,
                hardware: node.hardware ? JSON.parse(node.hardware) : [],
                monitorUrl: node.monitorUrl,
                project: node.project,
                performance: node.performances.length > 0 ? {
                    cpuUsage: node.performances[0].cpuUsage,
                    memoryUsage: node.performances[0].memoryUsage,
                    diskUsage: node.performances[0].diskUsage,
                    networkLatency: node.performances[0].networkLatency,
                    bandwidthUp: node.performances[0].bandwidthUp,
                    bandwidthDown: node.performances[0].bandwidthDown,
                    timestamp: node.performances[0].timestamp
                } : null,
                createdAt: node.createdAt,
                updatedAt: node.updatedAt
            };
            response_1.ResponseUtil.success(res, transformedNode, 'Node retrieved successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error getting node', {
                error: error.message,
                userId: req.user?.id
            });
            response_1.ResponseUtil.serverError(res);
        }
    }
    /**
     * Create new nodes (supports batch creation)
     */
    static async createNodes(req, res) {
        try {
            if (!req.user) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            const { nodeIds, projectId, type, capacity, location, monitorUrl, hardware } = req.body;
            // Check if project exists
            const project = await database_1.prisma.dePINProject.findUnique({
                where: { id: projectId }
            });
            if (!project) {
                response_1.ResponseUtil.notFound(res, 'Project not found');
                return;
            }
            // Check for duplicate node IDs for this user
            const existingNodes = await database_1.prisma.userNode.findMany({
                where: {
                    userId: req.user.id,
                    nodeId: {
                        in: nodeIds
                    }
                },
                select: {
                    nodeId: true
                }
            });
            if (existingNodes.length > 0) {
                const duplicateIds = existingNodes.map(node => node.nodeId);
                response_1.ResponseUtil.error(res, `Node IDs already exist: ${duplicateIds.join(', ')}`);
                return;
            }
            // Create nodes in batch
            const createdNodes = [];
            const failedNodes = [];
            for (const nodeId of nodeIds) {
                try {
                    // Auto-generate monitor URL for Filecoin nodes
                    let finalMonitorUrl = monitorUrl;
                    if (!finalMonitorUrl && project.name.toLowerCase().includes('filecoin') && nodeId.startsWith('f0')) {
                        finalMonitorUrl = `https://filfox.info/zh/address/${nodeId}`;
                    }
                    const node = await database_1.prisma.userNode.create({
                        data: {
                            userId: req.user.id,
                            projectId,
                            nodeId,
                            type,
                            capacity: capacity || null, // Will be updated by capacity query
                            location,
                            monitorUrl: finalMonitorUrl,
                            hardware: hardware ? JSON.stringify(hardware) : null,
                            status: 'online' // Default to online for demo
                        },
                        include: {
                            project: {
                                select: {
                                    name: true,
                                    category: true,
                                    blockchain: true
                                }
                            }
                        }
                    });
                    createdNodes.push({
                        id: node.id,
                        network: node.project.name,
                        nodeId: node.nodeId,
                        type: node.type,
                        capacity: node.capacity || 'Querying...',
                        earnings: node.earnings,
                        status: node.status.toLowerCase(),
                        uptime: node.uptime,
                        location: node.location,
                        startDate: node.startDate.toISOString().split('T')[0],
                        totalEarned: node.totalEarned,
                        hardware: node.hardware ? JSON.parse(node.hardware) : [],
                        monitorUrl: node.monitorUrl,
                        project: node.project,
                        createdAt: node.createdAt,
                        updatedAt: node.updatedAt
                    });
                    logger_1.Logger.info('Node created', {
                        userId: req.user.id,
                        nodeId,
                        projectId,
                        projectName: project.name
                    });
                }
                catch (error) {
                    logger_1.Logger.error('Failed to create node', {
                        error: error.message,
                        userId: req.user.id,
                        nodeId
                    });
                    failedNodes.push({ nodeId, error: error.message });
                }
            }
            // Async trigger capacity query for newly created nodes
            if (createdNodes.length > 0) {
                // Don't wait for capacity updates, do them asynchronously
                setImmediate(async () => {
                    for (const node of createdNodes) {
                        try {
                            const success = await external_api_service_1.ExternalApiService.updateSingleNodeCapacity(node.id, req.user.id);
                            if (success) {
                                logger_1.Logger.info('Node capacity updated', { nodeId: node.id, userId: req.user.id });
                            }
                        }
                        catch (error) {
                            logger_1.Logger.warn('Failed to update node capacity', {
                                nodeId: node.id,
                                error: error.message
                            });
                        }
                    }
                });
            }
            const responseData = {
                created: createdNodes,
                failed: failedNodes,
                summary: {
                    total: nodeIds.length,
                    created: createdNodes.length,
                    failed: failedNodes.length
                }
            };
            if (createdNodes.length === 0) {
                response_1.ResponseUtil.error(res, 'No nodes were created', 400);
                return;
            }
            response_1.ResponseUtil.success(res, responseData, `Successfully created ${createdNodes.length} of ${nodeIds.length} nodes`);
        }
        catch (error) {
            logger_1.Logger.error('Error creating nodes', {
                error: error.message,
                userId: req.user?.id
            });
            response_1.ResponseUtil.serverError(res);
        }
    }
    /**
     * Update a node
     */
    static async updateNode(req, res) {
        try {
            if (!req.user) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            const { id } = req.params;
            const updates = req.body;
            // Check if node exists and belongs to user
            const existingNode = await database_1.prisma.userNode.findFirst({
                where: {
                    id,
                    userId: req.user.id
                }
            });
            if (!existingNode) {
                response_1.ResponseUtil.notFound(res, 'Node not found');
                return;
            }
            // Update node
            const updatedNode = await database_1.prisma.userNode.update({
                where: { id },
                data: {
                    ...updates,
                    hardware: updates.hardware ? JSON.stringify(updates.hardware) : undefined,
                    updatedAt: new Date()
                },
                include: {
                    project: {
                        select: {
                            name: true,
                            category: true,
                            blockchain: true
                        }
                    }
                }
            });
            logger_1.Logger.info('Node updated', {
                userId: req.user.id,
                nodeId: updatedNode.nodeId,
                updates: Object.keys(updates)
            });
            const transformedNode = {
                id: updatedNode.id,
                network: updatedNode.project.name,
                nodeId: updatedNode.nodeId,
                type: updatedNode.type,
                capacity: updatedNode.capacity || 'Querying...',
                earnings: updatedNode.earnings,
                status: updatedNode.status.toLowerCase(),
                uptime: updatedNode.uptime,
                location: updatedNode.location,
                startDate: updatedNode.startDate.toISOString().split('T')[0],
                totalEarned: updatedNode.totalEarned,
                hardware: updatedNode.hardware ? JSON.parse(updatedNode.hardware) : [],
                monitorUrl: updatedNode.monitorUrl,
                project: updatedNode.project,
                createdAt: updatedNode.createdAt,
                updatedAt: updatedNode.updatedAt
            };
            response_1.ResponseUtil.success(res, transformedNode, 'Node updated successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error updating node', {
                error: error.message,
                userId: req.user?.id
            });
            response_1.ResponseUtil.serverError(res);
        }
    }
    /**
     * Delete a node
     */
    static async deleteNode(req, res) {
        try {
            if (!req.user) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            const { id } = req.params;
            // Check if node exists and belongs to user
            const existingNode = await database_1.prisma.userNode.findFirst({
                where: {
                    id,
                    userId: req.user.id
                },
                include: {
                    project: {
                        select: { name: true }
                    }
                }
            });
            if (!existingNode) {
                response_1.ResponseUtil.notFound(res, 'Node not found');
                return;
            }
            // Delete node (this will also cascade delete performance records)
            await database_1.prisma.userNode.delete({
                where: { id }
            });
            logger_1.Logger.info('Node deleted', {
                userId: req.user.id,
                nodeId: existingNode.nodeId,
                projectName: existingNode.project.name
            });
            response_1.ResponseUtil.success(res, null, 'Node deleted successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error deleting node', {
                error: error.message,
                userId: req.user?.id
            });
            response_1.ResponseUtil.serverError(res);
        }
    }
    /**
     * Update node performance data
     */
    static async updateNodePerformance(req, res) {
        try {
            if (!req.user) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            const { id } = req.params;
            const performanceData = req.body;
            // Check if node exists and belongs to user
            const node = await database_1.prisma.userNode.findFirst({
                where: {
                    id,
                    userId: req.user.id
                }
            });
            if (!node) {
                response_1.ResponseUtil.notFound(res, 'Node not found');
                return;
            }
            // Create new performance record
            const performance = await database_1.prisma.nodePerformance.create({
                data: {
                    nodeId: id,
                    cpuUsage: performanceData.cpuUsage,
                    memoryUsage: performanceData.memoryUsage,
                    diskUsage: performanceData.diskUsage,
                    networkLatency: performanceData.networkLatency,
                    bandwidthUp: performanceData.bandwidthUp,
                    bandwidthDown: performanceData.bandwidthDown
                }
            });
            // Update node status to online if it was syncing
            if (node.status === 'SYNCING') {
                await database_1.prisma.userNode.update({
                    where: { id },
                    data: { status: 'ONLINE' }
                });
            }
            logger_1.Logger.info('Node performance updated', {
                userId: req.user.id,
                nodeId: node.nodeId,
                performanceId: performance.id
            });
            response_1.ResponseUtil.success(res, {
                id: performance.id,
                nodeId: id,
                ...performanceData,
                timestamp: performance.timestamp
            }, 'Performance data updated successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error updating node performance', {
                error: error.message,
                userId: req.user?.id
            });
            response_1.ResponseUtil.serverError(res);
        }
    }
    /**
     * Get node performance history
     */
    static async getNodePerformanceHistory(req, res) {
        try {
            if (!req.user) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            const { id } = req.params;
            const { hours = 24, limit = 100, sortOrder = 'desc' } = req.query;
            // Check if node exists and belongs to user
            const node = await database_1.prisma.userNode.findFirst({
                where: {
                    id,
                    userId: req.user.id
                },
                select: { id: true, nodeId: true }
            });
            if (!node) {
                response_1.ResponseUtil.notFound(res, 'Node not found');
                return;
            }
            // Calculate time range
            const hoursAgo = new Date(Date.now() - Number(hours) * 60 * 60 * 1000);
            // Get performance history
            const performances = await database_1.prisma.nodePerformance.findMany({
                where: {
                    nodeId: id,
                    timestamp: {
                        gte: hoursAgo
                    }
                },
                orderBy: {
                    timestamp: sortOrder
                },
                take: Number(limit)
            });
            response_1.ResponseUtil.success(res, {
                nodeId: node.nodeId,
                timeRange: {
                    hours: Number(hours),
                    from: hoursAgo.toISOString(),
                    to: new Date().toISOString()
                },
                data: performances
            }, 'Performance history retrieved successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error getting node performance history', {
                error: error.message,
                userId: req.user?.id
            });
            response_1.ResponseUtil.serverError(res);
        }
    }
    /**
     * Update capacity for a specific node
     */
    static async updateNodeCapacity(req, res) {
        try {
            if (!req.user) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            const { id } = req.params;
            const success = await external_api_service_1.ExternalApiService.updateSingleNodeCapacity(id, req.user.id);
            if (!success) {
                response_1.ResponseUtil.error(res, 'Failed to update node capacity');
                return;
            }
            // Get updated node data
            const node = await database_1.prisma.userNode.findFirst({
                where: { id, userId: req.user.id },
                include: {
                    project: {
                        select: {
                            name: true,
                            category: true,
                            blockchain: true
                        }
                    }
                }
            });
            if (!node) {
                response_1.ResponseUtil.notFound(res, 'Node not found');
                return;
            }
            const transformedNode = {
                id: node.id,
                network: node.project.name,
                nodeId: node.nodeId,
                type: node.type,
                capacity: node.capacity || 'Querying...',
                earnings: node.earnings,
                status: node.status.toLowerCase(),
                uptime: node.uptime,
                location: node.location,
                startDate: node.startDate.toISOString().split('T')[0],
                totalEarned: node.totalEarned,
                hardware: node.hardware ? JSON.parse(node.hardware) : [],
                monitorUrl: node.monitorUrl,
                project: node.project,
                createdAt: node.createdAt,
                updatedAt: node.updatedAt
            };
            response_1.ResponseUtil.success(res, transformedNode, 'Node capacity updated successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error updating node capacity', {
                error: error.message,
                userId: req.user?.id
            });
            response_1.ResponseUtil.serverError(res);
        }
    }
    /**
     * Batch update capacities for all nodes without capacity
     */
    static async batchUpdateCapacities(req, res) {
        try {
            if (!req.user) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            const results = await external_api_service_1.ExternalApiService.updateNodeCapacities(req.user.id);
            response_1.ResponseUtil.success(res, results, `Batch capacity update completed: ${results.updated} updated, ${results.failed} failed`);
        }
        catch (error) {
            logger_1.Logger.error('Error in batch capacity update', {
                error: error.message,
                userId: req.user?.id
            });
            response_1.ResponseUtil.serverError(res);
        }
    }
}
exports.NodesController = NodesController;
//# sourceMappingURL=nodes.controller.js.map