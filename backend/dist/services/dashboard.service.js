"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const logger_1 = require("@/utils/logger");
const database_1 = require("@/services/database");
class DashboardService {
    /**
     * Get comprehensive dashboard statistics for a user
     */
    static async getDashboardStats(userId) {
        try {
            logger_1.Logger.info('Generating dashboard stats', { userId });
            // Get user's nodes with project information
            const nodes = await database_1.prisma.userNode.findMany({
                where: { userId },
                include: {
                    project: {
                        select: {
                            name: true,
                            category: true,
                            blockchain: true
                        }
                    },
                    performances: {
                        orderBy: { timestamp: 'desc' },
                        take: 1
                    }
                }
            });
            // Calculate overview statistics
            const overview = await this.calculateOverviewStats(nodes);
            // Get recent activity
            const recentActivity = await this.getRecentActivity(userId);
            // Calculate nodes by status distribution
            const nodesByStatus = this.calculateNodesByStatus(nodes);
            // Calculate nodes by project distribution
            const nodesByProject = this.calculateNodesByProject(nodes);
            // Generate earnings chart data (last 30 days)
            const earningsChart = await this.generateEarningsChart(userId);
            // Calculate performance metrics
            const performanceMetrics = await this.calculatePerformanceMetrics(userId);
            // Get top performing nodes
            const topPerformingNodes = this.getTopPerformingNodes(nodes);
            const stats = {
                overview,
                recentActivity,
                nodesByStatus,
                nodesByProject,
                earningsChart,
                performanceMetrics,
                topPerformingNodes
            };
            logger_1.Logger.info('Dashboard stats generated successfully', {
                userId,
                totalNodes: overview.totalNodes,
                onlineNodes: overview.onlineNodes
            });
            return stats;
        }
        catch (error) {
            logger_1.Logger.error('Error generating dashboard stats', {
                error: error.message,
                userId
            });
            // Return empty stats on error
            return {
                overview: {
                    totalNodes: 0,
                    onlineNodes: 0,
                    totalCapacity: '0',
                    totalEarnings: 0,
                    averageUptime: '0%',
                    totalProjects: 0
                },
                recentActivity: [],
                nodesByStatus: [],
                nodesByProject: [],
                earningsChart: [],
                performanceMetrics: null,
                topPerformingNodes: []
            };
        }
    }
    /**
     * Calculate overview statistics
     */
    static calculateOverviewStats(nodes) {
        const totalNodes = nodes.length;
        const onlineNodes = nodes.filter(node => node.status === 'ONLINE').length;
        // Calculate total capacity
        let totalCapacityValue = 0;
        let capacityUnit = 'TiB';
        nodes.forEach(node => {
            if (node.capacity && node.capacity !== 'Querying...') {
                const match = node.capacity.match(/(\d+\.?\d*)\s*(\w+)/);
                if (match) {
                    const value = parseFloat(match[1]);
                    const unit = match[2];
                    // Convert everything to TiB for consistency
                    if (unit === 'TiB' || unit === 'TB') {
                        totalCapacityValue += value;
                    }
                    else if (unit === 'GiB' || unit === 'GB') {
                        totalCapacityValue += value / 1024;
                    }
                    else if (unit === 'PiB' || unit === 'PB') {
                        totalCapacityValue += value * 1024;
                    }
                }
            }
        });
        const totalCapacity = totalCapacityValue > 0 ?
            `${totalCapacityValue.toFixed(2)} ${capacityUnit}` : '0 TiB';
        // Calculate total earnings
        const totalEarnings = nodes.reduce((sum, node) => sum + (node.totalEarned || 0), 0);
        // Calculate average uptime
        const uptimes = nodes
            .map(node => parseFloat(node.uptime?.replace('%', '') || '0'))
            .filter(uptime => uptime > 0);
        const averageUptime = uptimes.length > 0 ?
            `${(uptimes.reduce((sum, uptime) => sum + uptime, 0) / uptimes.length).toFixed(1)}%` : '0%';
        // Count unique projects
        const uniqueProjects = new Set(nodes.map(node => node.projectId));
        const totalProjects = uniqueProjects.size;
        return {
            totalNodes,
            onlineNodes,
            totalCapacity,
            totalEarnings: Math.round(totalEarnings * 100) / 100,
            averageUptime,
            totalProjects
        };
    }
    /**
     * Get recent activity for the user
     */
    static async getRecentActivity(userId) {
        try {
            const activities = [];
            // Get recent nodes (last 7 days)
            const recentNodes = await database_1.prisma.userNode.findMany({
                where: {
                    userId,
                    createdAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                },
                include: {
                    project: { select: { name: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: 10
            });
            // Add node creation activities
            recentNodes.forEach(node => {
                activities.push({
                    type: 'node_added',
                    message: `Added new ${node.project.name} node`,
                    timestamp: node.createdAt.toISOString(),
                    nodeId: node.nodeId,
                    projectName: node.project.name
                });
            });
            // Get recent capacity updates
            const recentCapacityUpdates = await database_1.prisma.userNode.findMany({
                where: {
                    userId,
                    capacity: { not: null },
                    updatedAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                },
                include: {
                    project: { select: { name: true } }
                },
                orderBy: { updatedAt: 'desc' },
                take: 5
            });
            // Add capacity update activities
            recentCapacityUpdates.forEach(node => {
                if (node.capacity && node.capacity !== 'Querying...') {
                    activities.push({
                        type: 'capacity_updated',
                        message: `Node capacity updated to ${node.capacity}`,
                        timestamp: node.updatedAt.toISOString(),
                        nodeId: node.nodeId,
                        projectName: node.project.name
                    });
                }
            });
            // Get recent performance records
            const recentPerformance = await database_1.prisma.nodePerformance.findMany({
                where: {
                    node: { userId }
                },
                include: {
                    node: {
                        include: {
                            project: { select: { name: true } }
                        }
                    }
                },
                orderBy: { timestamp: 'desc' },
                take: 5
            });
            // Add performance recording activities
            recentPerformance.forEach(perf => {
                activities.push({
                    type: 'performance_recorded',
                    message: `Performance metrics updated for ${perf.node.project.name} node`,
                    timestamp: perf.timestamp.toISOString(),
                    nodeId: perf.node.nodeId,
                    projectName: perf.node.project.name
                });
            });
            // Sort all activities by timestamp and return top 15
            return activities
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 15);
        }
        catch (error) {
            logger_1.Logger.error('Error getting recent activity', {
                error: error.message,
                userId
            });
            return [];
        }
    }
    /**
     * Calculate nodes by status distribution
     */
    static calculateNodesByStatus(nodes) {
        const statusCounts = nodes.reduce((counts, node) => {
            const status = node.status || 'UNKNOWN';
            counts[status] = (counts[status] || 0) + 1;
            return counts;
        }, {});
        const total = nodes.length;
        return Object.entries(statusCounts).map(([status, count]) => ({
            status: status.toLowerCase(),
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0
        }));
    }
    /**
     * Calculate nodes by project distribution
     */
    static calculateNodesByProject(nodes) {
        const projectGroups = nodes.reduce((groups, node) => {
            const projectName = node.project.name;
            if (!groups[projectName]) {
                groups[projectName] = {
                    category: node.project.category,
                    nodes: []
                };
            }
            groups[projectName].nodes.push(node);
            return groups;
        }, {});
        return Object.entries(projectGroups).map(([projectName, group]) => {
            // Calculate total capacity for this project
            let totalCapacityValue = 0;
            let capacityUnit = 'TiB';
            group.nodes.forEach(node => {
                if (node.capacity && node.capacity !== 'Querying...') {
                    const match = node.capacity.match(/(\d+\.?\d*)/);
                    if (match) {
                        totalCapacityValue += parseFloat(match[1]);
                    }
                }
            });
            const totalCapacity = totalCapacityValue > 0 ?
                `${totalCapacityValue.toFixed(2)} ${capacityUnit}` : '0 TiB';
            // Calculate average performance score
            const performanceScores = group.nodes
                .filter(node => node.performances.length > 0)
                .map(node => {
                const perf = node.performances[0];
                // Simple performance score based on resource usage (lower is better)
                return 100 - ((perf.cpuUsage + perf.memoryUsage + perf.diskUsage) / 3);
            });
            const averagePerformance = performanceScores.length > 0 ?
                Math.round(performanceScores.reduce((sum, score) => sum + score, 0) / performanceScores.length) : undefined;
            return {
                projectName,
                category: group.category.toLowerCase(),
                nodeCount: group.nodes.length,
                totalCapacity,
                averagePerformance
            };
        });
    }
    /**
     * Generate earnings chart data for the last 30 days
     */
    static async generateEarningsChart(userId) {
        try {
            // For now, generate mock earnings data based on node performance
            const nodes = await database_1.prisma.userNode.findMany({
                where: { userId },
                select: { totalEarned: true, createdAt: true }
            });
            const chartData = [];
            let cumulativeEarnings = 0;
            // Generate data for last 30 days
            for (let i = 29; i >= 0; i--) {
                const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
                const dateString = date.toISOString().split('T')[0];
                // Mock daily earnings based on number of nodes and random factors
                const dailyEarnings = nodes.length > 0 ?
                    Math.random() * nodes.length * 0.5 + nodes.length * 0.2 : 0;
                cumulativeEarnings += dailyEarnings;
                chartData.push({
                    date: dateString,
                    earnings: Math.round(dailyEarnings * 100) / 100,
                    cumulativeEarnings: Math.round(cumulativeEarnings * 100) / 100
                });
            }
            return chartData;
        }
        catch (error) {
            logger_1.Logger.error('Error generating earnings chart', {
                error: error.message,
                userId
            });
            return [];
        }
    }
    /**
     * Calculate performance metrics across all user's nodes
     */
    static async calculatePerformanceMetrics(userId) {
        try {
            // Get latest performance data for all user's nodes
            const performanceData = await database_1.prisma.nodePerformance.findMany({
                where: {
                    node: { userId },
                    timestamp: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                    }
                },
                orderBy: { timestamp: 'desc' }
            });
            if (performanceData.length === 0) {
                return null;
            }
            const averageCpuUsage = performanceData.reduce((sum, perf) => sum + perf.cpuUsage, 0) / performanceData.length;
            const averageMemoryUsage = performanceData.reduce((sum, perf) => sum + perf.memoryUsage, 0) / performanceData.length;
            const averageDiskUsage = performanceData.reduce((sum, perf) => sum + perf.diskUsage, 0) / performanceData.length;
            const averageNetworkLatency = performanceData.reduce((sum, perf) => sum + perf.networkLatency, 0) / performanceData.length;
            return {
                averageCpuUsage: Math.round(averageCpuUsage * 10) / 10,
                averageMemoryUsage: Math.round(averageMemoryUsage * 10) / 10,
                averageDiskUsage: Math.round(averageDiskUsage * 10) / 10,
                averageNetworkLatency: Math.round(averageNetworkLatency * 10) / 10
            };
        }
        catch (error) {
            logger_1.Logger.error('Error calculating performance metrics', {
                error: error.message,
                userId
            });
            return null;
        }
    }
    /**
     * Get top performing nodes based on various metrics
     */
    static getTopPerformingNodes(nodes) {
        return nodes
            .map(node => {
            // Calculate performance score
            let score = 0;
            // Uptime score (0-30 points)
            const uptimeValue = parseFloat(node.uptime?.replace('%', '') || '0');
            score += (uptimeValue / 100) * 30;
            // Capacity score (0-25 points) - higher capacity = higher score
            if (node.capacity && node.capacity !== 'Querying...') {
                const match = node.capacity.match(/(\d+\.?\d*)/);
                if (match) {
                    const capacityValue = parseFloat(match[1]);
                    score += Math.min(capacityValue / 100 * 25, 25); // Cap at 25 points
                }
            }
            // Earnings score (0-25 points)
            score += Math.min((node.totalEarned || 0) * 5, 25); // Cap at 25 points
            // Status score (0-20 points)
            if (node.status === 'ONLINE')
                score += 20;
            else if (node.status === 'SYNCING')
                score += 10;
            return {
                nodeId: node.nodeId,
                projectName: node.project.name,
                capacity: node.capacity || 'N/A',
                uptime: node.uptime || '0%',
                earnings: node.earnings || '$0/day',
                score: Math.round(score)
            };
        })
            .sort((a, b) => b.score - a.score)
            .slice(0, 5); // Top 5 nodes
    }
}
exports.DashboardService = DashboardService;
//# sourceMappingURL=dashboard.service.js.map