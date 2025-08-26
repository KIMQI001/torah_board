export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface WalletAuthRequest {
    walletAddress: string;
    publicKey: string;
    signature: string;
    message: string;
}
export interface AuthenticatedUser {
    id: string;
    walletAddress: string;
    publicKey: string;
}
export interface JwtPayload {
    userId: string;
    walletAddress: string;
    iat?: number;
    exp?: number;
}
export interface CreateProjectRequest {
    name: string;
    category: 'STORAGE' | 'COMPUTING' | 'WIRELESS' | 'SENSORS';
    description: string;
    blockchain: string;
    tokenSymbol: string;
    tokenPrice?: number;
    apy: string;
    minInvestment: number;
    roiPeriod: number;
    geographicFocus: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    hardwareRequirements: HardwareSpec[];
}
export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
}
export interface HardwareSpec {
    type: string;
    requirement: string;
    cost: number;
    powerConsumption: number;
}
export interface CreateNodeRequest {
    nodeIds: string[];
    projectId: string;
    type: string;
    capacity?: string;
    location?: string;
    monitorUrl?: string;
    hardware?: HardwareSpec[];
}
export interface UpdateNodeRequest {
    type?: string;
    capacity?: string;
    location?: string;
    monitorUrl?: string;
    status?: 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'ERROR';
    earnings?: string;
    totalEarned?: number;
    uptime?: string;
    hardware?: HardwareSpec[];
}
export interface NodePerformanceData {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkLatency: number;
    bandwidthUp: number;
    bandwidthDown: number;
}
export interface ROICalculationRequest {
    projectId: string;
    location: string;
    customCost?: number;
}
export interface ROICalculationResult {
    projectId: string;
    location: string;
    hardwareCost: number;
    monthlyCost: number;
    estimatedMonthlyReward: number;
    roiMonths: number;
    annualROI: number;
    riskFactors: string[];
}
export interface WSMessage {
    type: 'NODE_PERFORMANCE' | 'EARNINGS_UPDATE' | 'STATUS_CHANGE' | 'NOTIFICATION';
    payload: any;
    timestamp: number;
}
export interface NodePerformanceUpdate extends WSMessage {
    type: 'NODE_PERFORMANCE';
    payload: {
        nodeId: string;
        performance: NodePerformanceData;
    };
}
export interface SolanaWalletInfo {
    address: string;
    balance: number;
    tokens?: TokenBalance[];
}
export interface TokenBalance {
    mint: string;
    symbol: string;
    balance: number;
    decimals: number;
}
export interface CoinPriceData {
    symbol: string;
    price: number;
    change24h: number;
    marketCap: number;
    volume24h: number;
}
import { Request } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: AuthenticatedUser;
}
export interface QueryOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: Record<string, any>;
}
//# sourceMappingURL=index.d.ts.map