export interface DashboardStats {
    overview: {
        totalNodes: number;
        onlineNodes: number;
        totalCapacity: string;
        totalEarnings: number;
        averageUptime: string;
        totalProjects: number;
    };
    recentActivity: Array<{
        type: 'node_added' | 'capacity_updated' | 'performance_recorded' | 'earnings_updated';
        message: string;
        timestamp: string;
        nodeId?: string;
        projectName?: string;
    }>;
    nodesByStatus: Array<{
        status: string;
        count: number;
        percentage: number;
    }>;
    nodesByProject: Array<{
        projectName: string;
        category: string;
        nodeCount: number;
        totalCapacity: string;
        averagePerformance?: number;
    }>;
    earningsChart: Array<{
        date: string;
        earnings: number;
        cumulativeEarnings: number;
    }>;
    performanceMetrics: {
        averageCpuUsage: number;
        averageMemoryUsage: number;
        averageDiskUsage: number;
        averageNetworkLatency: number;
    } | null;
    topPerformingNodes: Array<{
        nodeId: string;
        projectName: string;
        capacity: string;
        uptime: string;
        earnings: string;
        score: number;
    }>;
}
export declare class DashboardService {
    /**
     * Get comprehensive dashboard statistics for a user
     */
    static getDashboardStats(userId: string): Promise<DashboardStats>;
    /**
     * Calculate overview statistics
     */
    private static calculateOverviewStats;
    /**
     * Get recent activity for the user
     */
    private static getRecentActivity;
    /**
     * Calculate nodes by status distribution
     */
    private static calculateNodesByStatus;
    /**
     * Calculate nodes by project distribution
     */
    private static calculateNodesByProject;
    /**
     * Generate earnings chart data for the last 30 days
     */
    private static generateEarningsChart;
    /**
     * Calculate performance metrics across all user's nodes
     */
    private static calculatePerformanceMetrics;
    /**
     * Get top performing nodes based on various metrics
     */
    private static getTopPerformingNodes;
}
//# sourceMappingURL=dashboard.service.d.ts.map