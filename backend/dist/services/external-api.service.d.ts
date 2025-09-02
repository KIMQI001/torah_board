export declare class ExternalApiService {
    private static readonly FILECOIN_API_BASE;
    private static readonly HELIUM_API_BASE;
    private static readonly REQUEST_TIMEOUT;
    private static readonly MAX_RETRIES;
    private static readonly API_RATE_LIMIT;
    private static readonly API_DELAY;
    /**
     * 简单的并发控制队列
     */
    private static activeRequests;
    private static requestQueue;
    private static processQueue;
    /**
     * 受限流控制的API请求
     */
    private static throttledRequest;
    /**
     * Retry mechanism for API calls
     */
    private static makeRequestWithRetry;
    /**
     * Query Filecoin miner earnings
     */
    static queryFilecoinMinerEarnings(minerId: string, duration?: '24h' | '7d' | '30d'): Promise<{
        daily: number;
        total: number;
    } | null>;
    /**
     * Query Filecoin miner power/capacity
     */
    static queryFilecoinMinerCapacity(minerId: string): Promise<string | null>;
    /**
     * Query Helium hotspot information
     */
    static queryHeliumHotspotInfo(hotspotAddress: string): Promise<{
        capacity: string | null;
        status: string | null;
        location: string | null;
    }>;
    /**
     * Generic capacity query based on project type and node ID
     */
    static queryNodeCapacity(projectName: string, nodeId: string): Promise<{
        capacity: string | null;
        status?: string | null;
        location?: string | null;
    }>;
    /**
     * Batch update node capacities for nodes without capacity
     */
    static updateNodeCapacities(userId?: string): Promise<{
        updated: number;
        failed: number;
        details: Array<{
            nodeId: string;
            success: boolean;
            capacity?: string;
            error?: string;
        }>;
    }>;
    /**
     * Update capacity for a specific node
     */
    static updateSingleNodeCapacity(nodeId: string, userId: string): Promise<boolean>;
}
//# sourceMappingURL=external-api.service.d.ts.map