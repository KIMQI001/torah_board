import { WebSocket } from 'ws';
export interface WebSocketMessage {
    type: 'node_update' | 'capacity_update' | 'performance_update' | 'earnings_update' | 'system_status';
    data: any;
    timestamp: string;
    userId?: string;
}
export interface AuthenticatedWebSocket extends WebSocket {
    userId?: string;
    walletAddress?: string;
    isAuthenticated?: boolean;
}
export declare class WebSocketService {
    private static wss;
    private static clients;
    /**
     * Initialize WebSocket server
     */
    static initialize(port: number): void;
    /**
     * Verify WebSocket client connection with JWT authentication
     */
    private static verifyClient;
    /**
     * Handle new WebSocket connection
     */
    private static handleConnection;
    /**
     * Handle incoming WebSocket messages
     */
    private static handleMessage;
    /**
     * Handle WebSocket disconnection
     */
    private static handleDisconnection;
    /**
     * Send message to a specific client
     */
    private static sendToClient;
    /**
     * Broadcast message to all clients of a specific user
     */
    static broadcastToUser(userId: string, message: WebSocketMessage): void;
    /**
     * Broadcast message to all connected clients
     */
    static broadcastToAll(message: WebSocketMessage): void;
    /**
     * Send node update notification
     */
    static notifyNodeUpdate(userId: string, nodeData: any): void;
    /**
     * Send capacity update notification
     */
    static notifyCapacityUpdate(userId: string, nodeId: string, capacity: string): void;
    /**
     * Send performance update notification
     */
    static notifyPerformanceUpdate(userId: string, nodeId: string, performance: any): void;
    /**
     * Send earnings update notification
     */
    static notifyEarningsUpdate(userId: string, earnings: any): void;
    /**
     * Get total number of active connections
     */
    static getTotalConnections(): number;
    /**
     * Get connection statistics
     */
    static getConnectionStats(): {
        totalUsers: number;
        totalConnections: number;
        userConnections: Array<{
            userId: string;
            connections: number;
        }>;
    };
    /**
     * Close all connections and stop the server
     */
    static stop(): void;
}
//# sourceMappingURL=websocket.service.d.ts.map