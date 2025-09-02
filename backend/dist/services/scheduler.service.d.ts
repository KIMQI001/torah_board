export declare class SchedulerService {
    private static isRunning;
    private static tasks;
    /**
     * Initialize all scheduled tasks
     */
    static initialize(): void;
    /**
     * Stop all scheduled tasks
     */
    static stop(): void;
    /**
     * Schedule automatic capacity updates every 4 hours
     */
    private static scheduleCapacityUpdates;
    /**
     * Schedule cleanup of old performance data every day at 2 AM
     */
    private static schedulePerformanceCleanup;
    /**
     * Schedule token price updates every 30 minutes
     */
    private static schedulePriceUpdates;
    /**
     * Mock function to fetch token price (replace with real API call)
     */
    private static fetchTokenPrice;
    /**
     * Manually trigger capacity update for all nodes
     */
    static triggerCapacityUpdate(): Promise<{
        success: boolean;
        message: string;
        stats?: {
            totalUsers: number;
            totalUpdated: number;
            totalFailed: number;
        };
    }>;
    /**
     * Schedule exchange symbols updates every 6 hours
     */
    private static scheduleExchangeSymbolsUpdates;
    /**
     * Manually trigger exchange symbols update
     */
    static triggerExchangeSymbolsUpdate(): Promise<{
        success: boolean;
        message: string;
        stats?: {
            totalSymbols: number;
            updateTime: string;
        };
    }>;
    /**
     * Get scheduler status and next run times
     */
    static getStatus(): {
        isRunning: boolean;
        activeTasks: Array<{
            name: string;
            nextRun: string | null;
            isRunning: boolean;
        }>;
    };
}
//# sourceMappingURL=scheduler.service.d.ts.map