// API configuration and service functions for DePIN backend

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api/v1';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5002';

// Types for API responses
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DePINProject {
  id: string;
  name: string;
  category: string;
  description: string;
  nodes: string;
  capacity: string;
  rewards: string;
  apy: string;
  status: string;
  blockchain: string;
  tokenSymbol: string;
  tokenPrice: number;
  marketCap: string;
  volume24h: string;
  hardwareRequirement: string;
  minInvestment: number;
  roiPeriod: number;
  geographicFocus: string;
  riskLevel: string;
  websiteUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserNode {
  id: string;
  network: string;
  nodeId: string;
  type: string;
  capacity: string;
  earnings: string;
  status: 'online' | 'offline' | 'syncing' | 'error';
  uptime: string;
  location: string;
  startDate: string;
  totalEarned: number;
  hardware: Array<{
    type: string;
    requirement: string;
    cost: number;
    powerConsumption: number;
  }>;
  monitorUrl?: string;
  project: {
    id: string;
    name: string;
    category: string;
    blockchain: string;
  };
  performance?: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkLatency: number;
    bandwidthUp: number;
    bandwidthDown: number;
    timestamp: string;
  };
  createdAt: string;
  updatedAt: string;
}

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

// Authentication functions
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    walletAddress: string;
    publicKey: string;
    balance: number;
    createdAt: string;
    lastLogin: string;
  };
}

// Store JWT token
let authToken: string | null = null;

export const setAuthToken = (token: string) => {
  authToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
};

export const getAuthToken = (): string | null => {
  if (authToken) return authToken;
  if (typeof window !== 'undefined') {
    authToken = localStorage.getItem('auth_token');
  }
  return authToken;
};

export const clearAuthToken = () => {
  authToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
};

// Generic API request function
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    console.log('API请求:', { url, config });
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('API响应:', data);
    return data;
  } catch (error) {
    console.error('API请求失败:', { url, error: error.message });
    throw error;
  }
}

// Authentication API
export const authApi = {
  async generateAuthMessage(walletAddress: string) {
    return apiRequest<{ message: string; walletAddress: string }>('/auth/message', {
      method: 'POST',
      body: JSON.stringify({ walletAddress }),
    });
  },

  async authenticate(walletAddress: string, publicKey: string, signature: string, message: string) {
    return apiRequest<AuthResponse>('/auth/authenticate', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, publicKey, signature, message }),
    });
  },

  async verify() {
    return apiRequest<{ user: AuthResponse['user'] }>('/auth/verify');
  },

  async refreshToken() {
    return apiRequest<{ token: string }>('/auth/refresh', {
      method: 'POST',
    });
  },

  async updateSettings(settings: any) {
    return apiRequest<{ user: AuthResponse['user'] }>('/auth/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }
};

// Projects API
export const projectsApi = {
  async getProjects(page = 1, limit = 20, category?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(category && { category })
    });
    
    return apiRequest<DePINProject[]>(`/projects?${params}`);
  },

  async getProject(id: string) {
    return apiRequest<DePINProject>(`/projects/${id}`);
  },

  async createProject(data: {
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
    websiteUrl?: string;
    hardwareRequirements: Array<{
      type: string;
      requirement: string;
      cost: number;
      powerConsumption: number;
    }>;
  }) {
    return apiRequest<DePINProject>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteProject(id: string) {
    return apiRequest<{ success: boolean; message: string }>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }
};

// Nodes API
export const nodesApi = {
  async getNodes(page = 1, limit = 100, status?: string, projectId?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
      ...(projectId && { projectId })
    });
    
    return apiRequest<UserNode[]>(`/nodes?${params}`);
  },

  async getNode(id: string) {
    return apiRequest<UserNode>(`/nodes/${id}`);
  },

  async createNodes(data: {
    nodeIds: string[];
    projectId: string;
    type: string;
    capacity?: string;
    location?: string;
    monitorUrl?: string;
    hardware?: Array<{
      type: string;
      requirement: string;
      cost: number;
      powerConsumption: number;
    }>;
  }) {
    return apiRequest<{
      created: UserNode[];
      failed: Array<{ nodeId: string; error: string }>;
      summary: {
        total: number;
        created: number;
        failed: number;
      };
    }>('/nodes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateNode(id: string, data: Partial<{
    type: string;
    capacity: string;
    location: string;
    monitorUrl: string;
    status: 'online' | 'offline' | 'syncing' | 'error';
    earnings: string;
    totalEarned: number;
    uptime: string;
    hardware: Array<{
      type: string;
      requirement: string;
      cost: number;
      powerConsumption: number;
    }>;
  }>) {
    return apiRequest<UserNode>(`/nodes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteNode(id: string) {
    return apiRequest<null>(`/nodes/${id}`, {
      method: 'DELETE',
    });
  },

  async updateNodePerformance(id: string, performance: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkLatency: number;
    bandwidthUp: number;
    bandwidthDown: number;
  }) {
    return apiRequest<{
      id: string;
      nodeId: string;
      timestamp: string;
    } & typeof performance>(`/nodes/${id}/performance`, {
      method: 'POST',
      body: JSON.stringify(performance),
    });
  },

  async updateCapacity(nodeId: string) {
    return apiRequest<UserNode>(`/nodes/${nodeId}/capacity`, {
      method: 'POST',
    });
  },

  async batchUpdateCapacities() {
    return apiRequest<{
      updated: number;
      failed: number;
      details: Array<{
        nodeId: string;
        success: boolean;
        capacity?: string;
        error?: string;
      }>;
    }>('/nodes/capacity/update', {
      method: 'POST',
    });
  }
};

// Dashboard API
export const dashboardApi = {
  async getStats() {
    return apiRequest<DashboardStats>('/dashboard/stats');
  },

  async getSchedulerStatus() {
    return apiRequest<{
      isRunning: boolean;
      activeTasks: Array<{
        name: string;
        nextRun: string | null;
        isRunning: boolean;
      }>;
    }>('/dashboard/scheduler/status');
  },

  async triggerCapacityUpdate() {
    return apiRequest<{
      totalUsers: number;
      totalUpdated: number;
      totalFailed: number;
    }>('/dashboard/capacity/update', {
      method: 'POST',
    });
  },

  async getEarnings(period: '7d' | '30d' | '90d' | '1y' = '30d') {
    return apiRequest<{
      period: string;
      totalEarnings: number;
      averageDailyEarnings: number;
      topEarningProject: string;
      growthPercentage: number;
      projectedMonthlyEarnings: number;
      breakdown: Array<{
        projectName: string;
        earnings: number;
        percentage: number;
      }>;
    }>(`/dashboard/earnings?period=${period}`);
  },

  async getSystemHealth() {
    return apiRequest<{
      database: string;
      scheduler: string;
      externalAPIs: {
        filecoin: string;
        helium: string;
      };
      lastChecked: string;
    }>('/dashboard/health');
  }
};

// ROI Calculator API
export const roiApi = {
  async calculateROI(data: {
    projectId: string;
    location: string;
    customInvestment?: number;
    includeHardwareCost?: boolean;
    powerCostPerKWh?: number;
    monthlyOperatingCost?: number;
  }) {
    return apiRequest<{
      projectName: string;
      location: string;
      investment: {
        initial: number;
        hardware: number;
        total: number;
      };
      operatingCosts: {
        monthly: number;
        annual: number;
        powerCost: number;
      };
      earnings: {
        daily: number;
        monthly: number;
        annual: number;
      };
      roi: {
        breakEvenMonths: number;
        roi12Months: number;
        roi24Months: number;
        annualROI: number;
      };
      projectedEarnings: Array<{
        month: number;
        cumulativeEarnings: number;
        netProfit: number;
        roiPercentage: number;
      }>;
    }>('/roi/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async compareProjects(projectIds: string[], location: string) {
    return apiRequest<{
      comparison: Array<{
        projectId: string;
        projectName: string;
        annualROI: number;
        breakEvenMonths: number;
        totalInvestment: number;
        riskLevel: string;
      }>;
      recommendation: string;
    }>('/roi/compare', {
      method: 'POST',
      body: JSON.stringify({ projectIds, location }),
    });
  },

  async getPopularLocations() {
    return apiRequest<{
      locations: Array<{
        name: string;
        description: string;
        powerCost: number;
        advantages: string[];
        bestFor: string[];
      }>;
    }>('/roi/locations');
  }
};

// WebSocket connection for real-time updates
export class DePINWebSocket {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private listeners: Map<string, Array<(data: any) => void>> = new Map();

  constructor() {
    this.token = getAuthToken();
  }

  connect() {
    if (!this.token) {
      console.warn('No auth token available for WebSocket connection');
      return;
    }

    // Enable WebSocket connection in development mode too
    console.log('Attempting WebSocket connection to:', WS_URL);

    const wsUrl = `${WS_URL}?token=${this.token}`;
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected to DePIN backend');
        this.emit('connected', {});
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.emit(message.type, message.data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.emit('disconnected', {});
        // Auto-reconnect in both development and production
        this.scheduleReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.warn('WebSocket connection failed (this is normal in development without WS server)');
        this.emit('error', error);
      };
      
    } catch (error) {
      console.warn('Failed to create WebSocket connection:', error);
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, 5000); // Reconnect after 5 seconds
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => listener(data));
    }
  }

  on(event: string, listener: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off(event: string, listener: (data: any) => void) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  send(type: string, data: any = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }
}

// Create singleton WebSocket instance
export const depinWebSocket = new DePINWebSocket();