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
let authToken: string | null = process.env.NODE_ENV === 'development' ? 'dev-token-test' : null;

// Smart cache for Filecoin API data
interface CacheItem<T> {
  data: T;
  timestamp: number;
  endpoint: string;
}

class SmartCache {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5分钟默认缓存
  private filecoinTTL = 2 * 60 * 1000; // Filecoin数据2分钟缓存（更短，因为收益数据变化快）

  get<T>(key: string, endpoint: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const ttl = this.getTTL(endpoint);
    if (Date.now() - item.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    console.log('💾 从缓存获取数据:', { key, age: Math.round((Date.now() - item.timestamp) / 1000) + 's' });
    return item.data;
  }

  set<T>(key: string, data: T, endpoint: string): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      endpoint
    });
    
    console.log('💾 数据已缓存:', { key, endpoint, cacheSize: this.cache.size });
  }

  private getTTL(endpoint: string): number {
    // Filecoin 相关数据缓存时间较短
    if (endpoint.includes('/earnings') || endpoint.includes('/capacity')) {
      return this.filecoinTTL;
    }
    // DAO相关数据需要更快更新，使用较短缓存
    if (endpoint.includes('/dao') || endpoint.includes('/project') || endpoint.includes('/proposal')) {
      return 30 * 1000; // 30秒缓存，确保创建后能快速看到更新
    }
    return this.defaultTTL;
  }

  clear(): void {
    this.cache.clear();
  }

  // 清除特定endpoint相关的缓存
  invalidateCache(pattern: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(pattern)
    );
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      console.log('💾 缓存已清除:', { key, pattern });
    });
  }

  getCacheInfo() {
    return {
      size: this.cache.size,
      items: Array.from(this.cache.entries()).map(([key, item]) => ({
        key,
        endpoint: item.endpoint,
        age: Math.round((Date.now() - item.timestamp) / 1000),
        expired: Date.now() - item.timestamp > this.getTTL(item.endpoint)
      }))
    };
  }
}

const smartCache = new SmartCache();

export const setAuthToken = (token: string) => {
  authToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
};

export const getAuthToken = (): string | null => {
  // 在开发环境中，如果没有设置token，使用默认开发token
  if (process.env.NODE_ENV === 'development' && !authToken) {
    authToken = 'dev-token-test';
  }
  
  if (authToken) return authToken;
  if (typeof window !== 'undefined') {
    authToken = localStorage.getItem('auth_token');
    // 如果localStorage也没有，且在开发环境中，使用默认开发token
    if (!authToken && process.env.NODE_ENV === 'development') {
      authToken = 'dev-token-test';
    }
  }
  return authToken;
};

export const clearAuthToken = () => {
  authToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
  // 清除认证token时也清除缓存
  smartCache.clear();
};

// 导出缓存管理函数
export const clearApiCache = () => {
  smartCache.clear();
  console.log('🗑️ API缓存已清除');
};

export const invalidateApiCache = (pattern: string) => {
  smartCache.invalidateCache(pattern);
  console.log('🗑️ API缓存已按模式清除:', pattern);
};

export const getApiCacheInfo = () => {
  return smartCache.getCacheInfo();
};

// Generic API request function with retry logic
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {},
  retryCount = 0,
  maxRetries = 2
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  
  console.log('🔐 Auth token status:', { 
    hasToken: !!token, 
    tokenLength: token?.length || 0,
    tokenPreview: token ? `${token.substring(0, 10)}...` : 'none'
  });
  
  // 创建缓存键（包含认证信息以确保用户隔离）
  const cacheKey = `${endpoint}:${JSON.stringify(options)}:${token?.substring(0, 10) || 'anon'}`;
  
  // 对于GET请求，尝试从缓存获取数据
  if ((!options.method || options.method.toUpperCase() === 'GET') && retryCount === 0) {
    const cachedData = smartCache.get(cacheKey, endpoint);
    if (cachedData) {
      return cachedData;
    }
  }
  
  // 根据请求类型设置不同的超时时间和重试次数
  let timeout = 10000; // 默认10秒
  let customMaxRetries = maxRetries;
  
  if (endpoint.includes('/earnings') || endpoint.includes('/capacity')) {
    timeout = 35000; // 收益和容量查询需要更长时间（35秒）
    customMaxRetries = 3; // Filecoin API 需要更多重试机会
  } else if (endpoint.includes('/dashboard/stats')) {
    timeout = 25000; // 仪表板统计需要中等时间（25秒）
    customMaxRetries = 3; // 仪表板统计也需要更多重试
  }
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    console.log('🔥 API请求:', { 
      url, 
      method: config.method || 'GET', 
      hasAuth: !!token,
      timeout: `${timeout}ms`,
      attempt: retryCount + 1
    });
    
    // Test network connectivity with dynamic timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, { 
      ...config, 
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = 'Failed to read error response';
      }
      
      console.error('❌ API响应错误 - Status:', response.status);
      console.error('❌ API响应错误 - StatusText:', response.statusText);
      console.error('❌ API响应错误 - URL:', url);
      console.error('❌ API响应错误 - Body:', errorText);
      console.error('❌ API响应错误 - ContentType:', response.headers.get('content-type'));
      console.error('❌ API响应错误 - Method:', config.method || 'GET');
      console.error('❌ API响应错误 - Headers:', JSON.stringify(Object.fromEntries(response.headers)));
      
      // Try to parse error body as JSON
      let parsedError;
      try {
        parsedError = JSON.parse(errorText);
        console.error('❌ API错误详情:', parsedError);
      } catch (e) {
        console.error('❌ 无法解析错误响应为JSON');
      }
      
      const errorInfo = {
        status: response.status,
        statusText: response.statusText,
        url,
        errorText: errorText || 'No error text',
        contentType: response.headers.get('content-type')
      };
      
      console.error('❌ Complete error info:', JSON.stringify(errorInfo, null, 2));
      
      if (response.status === 429 && retryCount < customMaxRetries) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '1');
        const delay = Math.min(retryAfter * 1000, 5000); // Max 5 seconds
        
        console.log(`⏳ Rate limited, retrying after ${delay}ms (attempt ${retryCount + 1}/${customMaxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return apiRequest<T>(endpoint, options, retryCount + 1, maxRetries);
      } else if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const message = retryAfter 
          ? `Too many requests. Please wait ${retryAfter} seconds before trying again.`
          : 'Too many requests. Please wait a moment before trying again.';
        throw new Error(message);
      }
      
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const responseData = await response.json();
    console.log('✅ API响应成功:', { url, responseType: typeof responseData, response: responseData });
    
    // 检查是否为标准API响应格式 {success: true, data: ...}
    if (responseData && typeof responseData === 'object' && 'success' in responseData) {
      if (responseData.success) {
        console.log('✅ 提取数据字段:', responseData.data);
        
        // 对于GET请求，将成功的响应缓存起来
        if (!options.method || options.method.toUpperCase() === 'GET') {
          smartCache.set(cacheKey, responseData.data, endpoint);
        } else {
          // 对于POST/PUT/DELETE等修改操作，清除相关缓存
          const method = options.method?.toUpperCase();
          if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method || '')) {
            // 清除与该endpoint相关的缓存
            const basePath = endpoint.split('/').slice(0, -1).join('/'); // 移除最后的ID等参数
            smartCache.invalidateCache(basePath);
            console.log('🔄 修改操作完成，已清除相关缓存:', { method, endpoint, basePath });
          }
        }
        
        return responseData.data;
      } else {
        // API返回success: false的错误
        const errorMsg = responseData.error || responseData.message || 'API request failed';
        console.error('❌ API业务逻辑错误:', errorMsg);
        throw new Error(errorMsg);
      }
    }
    
    // 如果不是标准格式，直接返回
    console.log('ℹ️ 非标准API响应，直接返回:', responseData);
    
    // 对于GET请求，也缓存非标准格式的响应
    if (!options.method || options.method.toUpperCase() === 'GET') {
      smartCache.set(cacheKey, responseData, endpoint);
    } else {
      // 对于POST/PUT/DELETE等修改操作，清除相关缓存
      const method = options.method?.toUpperCase();
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method || '')) {
        // 清除与该endpoint相关的缓存
        const basePath = endpoint.split('/').slice(0, -1).join('/'); // 移除最后的ID等参数
        smartCache.invalidateCache(basePath);
        console.log('🔄 修改操作完成，已清除相关缓存(非标准格式):', { method, endpoint, basePath });
      }
    }
    
    return responseData;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('⏰ API请求超时:', { 
        url, 
        timeout: `${timeout}ms`,
        attempt: retryCount + 1,
        maxRetries 
      });
      
      // 对于超时，如果还有重试次数，就重试
      if (retryCount < customMaxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // 指数退避，最大5秒
        console.log(`⏳ API超时重试，等待 ${delay}ms 后重试 (尝试 ${retryCount + 2}/${customMaxRetries + 1})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return apiRequest<T>(endpoint, options, retryCount + 1, maxRetries);
      } else {
        const timeoutSeconds = Math.round(timeout / 1000);
        throw new Error(`请求超时（${timeoutSeconds}秒）- 服务器响应时间过长，请稍后重试`);
      }
    } else if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('🌐 网络连接失败:', { 
        url, 
        message: '无法连接到后端服务器',
        possibleCauses: ['后端服务器未运行', 'CORS配置错误', '网络连接问题']
      });
      throw new Error('Network connection failed - backend server may be down');
    } else {
      console.error('💥 API请求异常:', { 
        url, 
        error: error instanceof Error ? error.message : String(error),
        errorType: typeof error,
        errorName: error instanceof Error ? error.name : 'unknown',
        stack: error instanceof Error ? error.stack?.substring(0, 300) : undefined,
        attempt: retryCount + 1
      });
      throw error;
    }
  }
}

// Health check API
export const healthApi = {
  async checkBackend() {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/api/v1', '')}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ 后端健康检查成功:', data);
        return { success: true, data };
      } else {
        console.error('❌ 后端健康检查失败:', response.status, response.statusText);
        return { success: false, error: `${response.status} ${response.statusText}` };
      }
    } catch (error) {
      console.error('🌐 后端连接失败:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Connection failed' };
    }
  }
};

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

// DAO Types and API
export interface DAO {
  id: string;
  name: string;
  description: string;
  treasuryAddress: string;
  governanceToken: string;
  totalSupply: number;
  quorumThreshold: number;
  votingPeriod: number;
  status: 'ACTIVE' | 'PAUSED' | 'DISSOLVED';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members: DAOMember[];
  proposals: DAOProposal[];
  projects: DAOProject[];
  _count: {
    members: number;
    proposals: number;
    projects: number;
  };
}

export interface DAOMember {
  id: string;
  daoId: string;
  userId: string;
  address: string;
  role: 'CHAIR' | 'ADMIN' | 'MEMBER';
  votingPower: number;
  reputation: number;
  contributionScore: number;
  joinDate: string;
  lastActivity: string;
  proposalsCreated: number;
  votesParticipated: number;
  status: 'ACTIVE' | 'INACTIVE';
  user?: {
    walletAddress: string;
    createdAt: string;
    lastLogin: string;
  };
  votes?: DAOVote[];
}

export interface DAOProposal {
  id: string;
  daoId: string;
  proposer: string;
  title: string;
  description: string;
  category: 'INVESTMENT' | 'GOVERNANCE' | 'TREASURY' | 'MEMBERSHIP';
  status: 'DRAFT' | 'ACTIVE' | 'EXECUTED' | 'FAILED' | 'CANCELLED';
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  totalVotes: number;
  quorumReached: boolean;
  thresholdMet: boolean;
  requestedAmount?: number;
  requestedToken?: string;
  recipientAddress?: string;
  votingStartDate: string;
  votingEndDate: string;
  executedDate?: string;
  createdAt: string;
  votes?: DAOVote[];
  userVote?: {
    voteType: 'FOR' | 'AGAINST' | 'ABSTAIN';
    votingPower: number;
    votedAt: string;
    reason?: string;
  };
}

export interface DAOProject {
  id: string;
  daoId: string;
  title: string;
  description: string;
  category: string;
  status: 'PLANNING' | 'ACTIVE' | 'MILESTONE_PENDING' | 'COMPLETED' | 'CANCELLED';
  totalBudget: number;
  allocatedFunds: number;
  spentFunds: number;
  roi?: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  teamMembers: string[];
  startDate: string;
  expectedEndDate: string;
  completedDate?: string;
  createdAt: string;
  milestones: DAOMilestone[];
}

export interface DAOMilestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'PAID';
  targetDate: string;
  completedDate?: string;
  budget: number;
  deliverables: string[];
  verificationReq: number;
  createdAt: string;
}

export interface DAOTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigneeId?: string;
  costEstimate: number;
  tokenReward: number;
  dueDate?: string;
  completedDate?: string;
  attachments?: string;
  tags?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DAOVote {
  id: string;
  proposalId: string;
  voterId: string;
  voteType: 'FOR' | 'AGAINST' | 'ABSTAIN';
  votingPower: number;
  reason?: string;
  timestamp: string;
}

export interface DAOTreasury {
  id: string;
  daoId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'INVESTMENT' | 'REWARD' | 'FEE' | 'MILESTONE_PAYMENT';
  amount: number;
  token: string;
  txHash?: string;
  recipientAddress?: string;
  relatedProjectId?: string;
  description?: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  initiatedBy: string;
  processedBy?: string;
  processedAt?: string;
  timestamp: string;
}

// DAO API
export const daoApi = {
  // DAO Management
  async getDAOs(userId?: string) {
    const params = userId ? `?userId=${userId}` : '';
    return apiRequest<DAO[]>(`/daos${params}`);
  },

  async getDAO(id: string) {
    return apiRequest<DAO>(`/daos/${id}`);
  },

  async createDAO(data: {
    name: string;
    description: string;
    treasuryAddress: string;
    governanceToken: string;
    totalSupply?: number;
    quorumThreshold?: number;
    votingPeriod?: number;
  }) {
    return apiRequest<DAO>('/daos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateDAO(id: string, data: Partial<{
    name: string;
    description: string;
    quorumThreshold: number;
    votingPeriod: number;
    status: 'ACTIVE' | 'PAUSED' | 'DISSOLVED';
  }>) {
    return apiRequest<DAO>(`/daos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async joinDAO(id: string) {
    return apiRequest<DAOMember>(`/daos/${id}/join`, {
      method: 'POST',
    });
  },

  async leaveDAO(id: string) {
    return apiRequest<null>(`/daos/${id}/leave`, {
      method: 'POST',
    });
  },

  async deleteDAO(id: string) {
    return apiRequest<null>(`/daos/${id}`, {
      method: 'DELETE',
    });
  },

  async getDAOStats(id: string) {
    return apiRequest<{
      memberCount: number;
      activeProposals: number;
      activeProjects: number;
      treasuryBalance: Record<string, number>;
      totalDistributed: number;
    }>(`/daos/${id}/stats`);
  },

  // Proposals
  async getProposals(daoId: string, status?: string, page = 1, limit = 20) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status })
    });
    return apiRequest<DAOProposal[]>(`/daos/${daoId}/proposals?${params}`);
  },

  async getProposal(id: string) {
    return apiRequest<DAOProposal>(`/proposals/${id}`);
  },

  async createProposal(daoId: string, data: {
    title: string;
    description: string;
    category: 'INVESTMENT' | 'GOVERNANCE' | 'TREASURY' | 'MEMBERSHIP';
    requestedAmount?: number;
    votingPeriodDays?: number;
    threshold?: number;
    discussion?: string;
    attachments?: string[];
  }) {
    return apiRequest<DAOProposal>(`/daos/${daoId}/proposals`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async voteOnProposal(id: string, data: {
    voteType: 'FOR' | 'AGAINST' | 'ABSTAIN';
    reason?: string;
  }) {
    return apiRequest<DAOVote>(`/proposals/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async activateProposal(id: string) {
    return apiRequest<DAOProposal>(`/proposals/${id}/activate`, {
      method: 'POST',
    });
  },

  async executeProposal(id: string) {
    return apiRequest<DAOProposal>(`/proposals/${id}/execute`, {
      method: 'POST',
    });
  },

  async cancelProposal(id: string) {
    return apiRequest<DAOProposal>(`/proposals/${id}/cancel`, {
      method: 'POST',
    });
  },

  async deleteProposal(id: string) {
    return apiRequest<{ id: string }>(`/proposals/${id}`, {
      method: 'DELETE',
    });
  },

  // Projects
  async getProjects(daoId: string, status?: string, page = 1, limit = 20) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status })
    });
    return apiRequest<DAOProject[]>(`/daos/${daoId}/projects?${params}`);
  },

  async getProject(id: string) {
    return apiRequest<DAOProject>(`/projects/${id}`);
  },

  async createProject(daoId: string, data: {
    title: string;
    description: string;
    category: string;
    totalBudget: number;
    roi?: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    teamMembers?: string[];
    startDate: string;
    expectedEndDate: string;
    milestones?: Array<{
      title: string;
      description: string;
      targetDate: string;
      budget: number;
      deliverables?: string[];
      verificationReq?: number;
    }>;
  }) {
    return apiRequest<DAOProject>(`/daos/${daoId}/projects`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProject(id: string, data: Partial<DAOProject>) {
    return apiRequest<DAOProject>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteProject(id: string) {
    return apiRequest<null>(`/projects/${id}`, {
      method: 'DELETE',
    });
  },

  // Members
  async getMembers(daoId: string, role?: string, status?: string, page = 1, limit = 50) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(role && { role }),
      ...(status && { status })
    });
    return apiRequest<DAOMember[]>(`/daos/${daoId}/members?${params}`);
  },

  async getMember(daoId: string, memberId: string) {
    return apiRequest<DAOMember>(`/daos/${daoId}/members/${memberId}`);
  },

  async getMemberActivity(daoId: string, memberId: string) {
    return apiRequest<{
      member: DAOMember;
      recentVotes: DAOVote[];
      proposalsCreated: DAOProposal[];
    }>(`/daos/${daoId}/members/${memberId}/activity`);
  },

  async updateMemberRole(daoId: string, memberId: string, role: 'CHAIR' | 'ADMIN' | 'MEMBER') {
    return apiRequest<DAOMember>(`/daos/${daoId}/members/${memberId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },

  async updateVotingPower(daoId: string, memberId: string, votingPower: number) {
    return apiRequest<DAOMember>(`/daos/${daoId}/members/${memberId}/voting-power`, {
      method: 'PUT',
      body: JSON.stringify({ votingPower }),
    });
  },

  async updateContributionScore(daoId: string, memberId: string, contributionScore: number, reason?: string) {
    return apiRequest<DAOMember>(`/daos/${daoId}/members/${memberId}/contribution-score`, {
      method: 'PUT',
      body: JSON.stringify({ contributionScore, reason }),
    });
  },

  async removeMember(daoId: string, memberId: string) {
    return apiRequest<null>(`/daos/${daoId}/members/${memberId}`, {
      method: 'DELETE',
    });
  },

  // Treasury
  async getTreasuryTransactions(daoId: string, type?: string, status?: string, token?: string, page = 1, limit = 50) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(type && { type }),
      ...(status && { status }),
      ...(token && { token })
    });
    return apiRequest<DAOTreasury[]>(`/daos/${daoId}/treasury/transactions?${params}`);
  },

  async getTreasuryBalance(daoId: string) {
    return apiRequest<{
      balance: Array<{
        token: string;
        amount: number;
        usdValue: number;
      }>;
      totalValueUSD: number;
    }>(`/daos/${daoId}/treasury/balance`);
  },

  async getTreasuryAnalytics(daoId: string, period = '30') {
    return apiRequest<{
      summary: {
        totalDeposits: number;
        totalWithdrawals: number;
        totalInvestments: number;
        totalRewards: number;
        netFlow: number;
      };
      dailyFlow: Array<{
        date: string;
        deposits: number;
        withdrawals: number;
        investments: number;
      }>;
      tokenFlow: Array<{
        token: string;
        deposits: number;
        withdrawals: number;
        netFlow: number;
      }>;
      transactionCount: number;
    }>(`/daos/${daoId}/treasury/analytics?period=${period}`);
  },

  async createDeposit(daoId: string, data: {
    amount: number;
    token: string;
    txHash: string;
    description?: string;
  }) {
    return apiRequest<DAOTreasury>(`/daos/${daoId}/treasury/deposit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async createWithdrawal(daoId: string, data: {
    amount: number;
    token: string;
    recipientAddress: string;
    description?: string;
  }) {
    return apiRequest<DAOTreasury>(`/daos/${daoId}/treasury/withdrawal`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async createInvestment(daoId: string, data: {
    amount: number;
    token: string;
    projectId?: string;
    description: string;
  }) {
    return apiRequest<DAOTreasury>(`/daos/${daoId}/treasury/investment`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async approveTransaction(transactionId: string, txHash?: string) {
    return apiRequest<DAOTreasury>(`/treasury/transactions/${transactionId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ txHash }),
    });
  },

  async rejectTransaction(transactionId: string, reason?: string) {
    return apiRequest<DAOTreasury>(`/treasury/transactions/${transactionId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Tasks
  async getTasks(projectId: string, status?: string, assigneeId?: string, priority?: string, page = 1, limit = 20) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
      ...(assigneeId && { assigneeId }),
      ...(priority && { priority })
    });
    return apiRequest<DAOTask[]>(`/projects/${projectId}/tasks?${params}`);
  },

  async getTask(id: string) {
    return apiRequest<DAOTask>(`/tasks/${id}`);
  },

  async createTask(projectId: string, data: {
    title: string;
    description: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    assigneeId?: string;
    costEstimate?: number;
    tokenReward?: number;
    dueDate?: string;
    tags?: string[];
  }) {
    return apiRequest<DAOTask>(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateTask(id: string, data: {
    title?: string;
    description?: string;
    status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    assigneeId?: string;
    costEstimate?: number;
    tokenReward?: number;
    dueDate?: string;
    completedDate?: string;
    attachments?: string[];
    tags?: string[];
  }) {
    return apiRequest<DAOTask>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteTask(id: string) {
    return apiRequest<null>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  },

  // Spot Trading APIs
  async getMarketData(params?: {
    symbols?: string[];
    exchange?: string;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.symbols) {
      params.symbols.forEach(symbol => searchParams.append('symbols', symbol));
    }
    if (params?.exchange) searchParams.set('exchange', params.exchange);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    
    const query = searchParams.toString();
    return apiRequest<any[]>(`/spot/markets${query ? '?' + query : ''}`);
  },

  async getSymbolData(symbol: string, exchange?: string) {
    const query = exchange ? `?exchange=${exchange}` : '';
    return apiRequest<any>(`/spot/markets/${symbol}${query}`);
  },

  async getPriceComparison(symbol: string) {
    return apiRequest<any>(`/spot/markets/${symbol}/comparison`);
  },

  async getOrderBook(symbol: string, exchange = 'binance', limit = 20) {
    return apiRequest<any>(`/spot/markets/${symbol}/orderbook?exchange=${exchange}&limit=${limit}`);
  },

  async getPriceAlerts(activeOnly = false) {
    return apiRequest<any[]>(`/spot/alerts?active=${activeOnly}`);
  },

  async createPriceAlert(data: {
    symbol: string;
    targetPrice: number;
    condition: 'above' | 'below' | 'crosses_above' | 'crosses_below';
    exchange?: string;
    message?: string;
  }) {
    return apiRequest<any>('/spot/alerts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updatePriceAlert(id: string, data: any) {
    return apiRequest<any>(`/spot/alerts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deletePriceAlert(id: string) {
    return apiRequest<any>(`/spot/alerts/${id}`, {
      method: 'DELETE',
    });
  },

  async getAnnouncements(params?: {
    exchange?: string;
    category?: string;
    importance?: 'high' | 'medium' | 'low';
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.exchange) searchParams.set('exchange', params.exchange);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.importance) searchParams.set('importance', params.importance);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    
    const query = searchParams.toString();
    return apiRequest<any[]>(`/spot/announcements${query ? '?' + query : ''}`);
  },

  async getHighPriorityAnnouncements() {
    return apiRequest<any[]>('/spot/announcements/high-priority');
  },

  async getTokenAnnouncements(symbol: string) {
    return apiRequest<any[]>(`/spot/announcements/token/${symbol}`);
  },

  async getPriceAnomalies(symbols?: string[]) {
    const query = symbols ? `?symbols=${symbols.join(',')}` : '';
    return apiRequest<any[]>(`/spot/anomalies${query}`);
  },

  async getMarketOverview() {
    return apiRequest<any>('/spot/stats/overview');
  },

  async getTrendingTokens(limit = 20) {
    return apiRequest<any[]>(`/spot/stats/trending?limit=${limit}`);
  },

  async getTopGainers(limit = 20) {
    return apiRequest<any[]>(`/spot/stats/gainers?limit=${limit}`);
  },

  async getTopLosers(limit = 20) {
    return apiRequest<any[]>(`/spot/stats/losers?limit=${limit}`);
  },

  // 收藏功能相关API
  async getFavoriteSymbols() {
    return apiRequest<any[]>('/spot/favorites');
  },

  async addFavoriteSymbol(symbol: string, baseAsset: string, quoteAsset: string) {
    return apiRequest<any>('/spot/favorites', {
      method: 'POST',
      body: JSON.stringify({ symbol, baseAsset, quoteAsset })
    });
  },

  async removeFavoriteSymbol(symbol: string) {
    return apiRequest<any>(`/spot/favorites/${symbol}`, {
      method: 'DELETE'
    });
  },

  // 交易所币种数据库API
  async searchExchangeSymbols(query: string = '', limit: number = 50, exchanges?: string[]) {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString()
    });
    
    if (exchanges && exchanges.length > 0) {
      exchanges.forEach(exchange => params.append('exchanges', exchange));
    }
    
    return apiRequest<any[]>(`/spot/symbols/search?${params.toString()}`);
  },

  async getAllExchangeSymbols(limit: number = 1000, exchanges?: string[]) {
    const params = new URLSearchParams({
      limit: limit.toString()
    });
    
    if (exchanges && exchanges.length > 0) {
      exchanges.forEach(exchange => params.append('exchanges', exchange));
    }
    
    return apiRequest<any[]>(`/spot/symbols/all?${params.toString()}`);
  },

  async updateExchangeSymbols() {
    return apiRequest<any>('/spot/symbols/update', {
      method: 'POST'
    });
  },

  async getExchangeSymbolsStats() {
    return apiRequest<any>('/spot/symbols/stats');
  }
};

// Create singleton WebSocket instance
export const depinWebSocket = new DePINWebSocket();