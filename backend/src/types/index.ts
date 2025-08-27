// API Response types
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

// User and Authentication types
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

// DePIN Project types
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
  websiteUrl?: string;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {}

export interface HardwareSpec {
  type: string;
  requirement: string;
  cost: number;
  powerConsumption: number;
}

// Node types
export interface CreateNodeRequest {
  nodeIds: string[]; // Support batch creation
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

// ROI Calculation types
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

// WebSocket types
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

// External API types
export interface SolanaWalletInfo {
  address: string;
  balance: number; // SOL balance
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

// Request context  
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// Database query options
export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}