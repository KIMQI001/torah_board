// DePIN store using real API instead of localStorage

import { 
  projectsApi, 
  nodesApi, 
  dashboardApi, 
  authApi, 
  setAuthToken, 
  getAuthToken,
  clearAuthToken,
  getDepinWebSocket,
  type DePINProject, 
  type UserNode, 
  type DashboardStats 
} from '@/lib/api';
import { walletUtils, type WalletConnection } from '@/lib/wallet';

// 收益数据类型定义
export interface EarningsData {
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
}

export interface ApiDePINStore {
  // Authentication state
  isAuthenticated: boolean;
  user: any | null;
  
  // Data state
  projects: DePINProject[];
  nodes: UserNode[];
  dashboardStats: DashboardStats | null;
  earnings: EarningsData | null;
  
  // Loading states
  loading: {
    projects: boolean;
    nodes: boolean;
    dashboard: boolean;
    earnings: boolean;
    auth: boolean;
  };
  
  // Error states
  errors: {
    projects: string | null;
    nodes: string | null;
    dashboard: string | null;
    earnings: string | null;
    auth: string | null;
  };
  
  // Listeners for state changes
  listeners: Set<() => void>;
}

class ApiDePINStoreClass {
  private state: ApiDePINStore = {
    isAuthenticated: false,
    user: null,
    projects: [],
    nodes: [],
    dashboardStats: null,
    earnings: null,
    loading: {
      projects: false,
      nodes: false,
      dashboard: false,
      earnings: false,
      auth: false
    },
    errors: {
      projects: null,
      nodes: null,
      dashboard: null,
      earnings: null,
      auth: null
    },
    listeners: new Set()
  };

  constructor() {
    // Initialize authentication state
    this.initializeAuth();
    
    // Set up wallet connection listener
    walletUtils.onConnectionChange(this.handleWalletChange.bind(this));
    
    // Set up WebSocket listeners for real-time updates
    this.setupWebSocketListeners();
    
    // Always load projects (no auth required)
    this.loadProjects();
  }

  private async initializeAuth() {
    const token = getAuthToken();
    if (token) {
      try {
        this.setLoading('auth', true);
        const response = await authApi.verify();
        console.log('🔐 Auth verify response:', response);
        if (response && (response.user || response.data?.user)) {
          this.state.isAuthenticated = true;
          this.state.user = response.user || response.data?.user || response;
          
          // Connect WebSocket
          const ws = getDepinWebSocket();
          if (ws) ws.connect();
          
          // Load initial data
          this.loadInitialData();
        }
      } catch (error) {
        console.error('Authentication verification failed:', error);
        // 不清除token，让AuthContext处理
        // clearAuthToken();
        // this.state.isAuthenticated = false;
        // this.state.user = null;
      } finally {
        this.setLoading('auth', false);
      }
    } else {
      // 没有token，等待用户连接钱包认证
      console.log('🔌 DePIN Store: 无认证token，等待钱包连接');
      this.setLoading('auth', false);
    }
  }

  // 添加方法从AuthContext同步用户信息
  syncAuthContext(isAuthenticated: boolean, user: any) {
    if (isAuthenticated && user && !this.state.isAuthenticated) {
      console.log('🔄 DePIN Store: 从AuthContext同步认证状态', user);
      this.state.isAuthenticated = true;
      this.state.user = user;
      
      // Connect WebSocket
      const ws = getDepinWebSocket();
      if (ws) ws.connect();
      
      // Load initial data
      this.loadInitialData();
      this.notifyListeners();
    } else if (!isAuthenticated && this.state.isAuthenticated) {
      console.log('🔄 DePIN Store: 清除认证状态');
      this.state.isAuthenticated = false;
      this.state.user = null;
      const ws = getDepinWebSocket();
      if (ws) ws.disconnect();
      this.notifyListeners();
    }
  }

  private async handleWalletChange(connection: WalletConnection) {
    if (connection.connected && !this.state.isAuthenticated) {
      await this.authenticateWithWallet(connection);
    } else if (!connection.connected && this.state.isAuthenticated) {
      this.logout();
    }
  }

  private async authenticateWithWallet(connection: WalletConnection) {
    if (!connection.walletAddress || !connection.publicKey) return;
    
    try {
      this.setLoading('auth', true);
      this.setError('auth', null);
      
      // Step 1: Generate authentication message
      const messageResponse = await authApi.generateAuthMessage(connection.walletAddress);
      console.log('📝 Generate auth message response:', messageResponse);
      if (!messageResponse || !messageResponse.message) {
        throw new Error('Failed to generate auth message');
      }
      
      // Step 2: Sign the message
      const signature = await walletUtils.signMessage(messageResponse.data.message);
      
      // Step 3: Authenticate with backend
      const authResponse = await authApi.authenticate(
        connection.walletAddress,
        connection.publicKey,
        signature,
        messageResponse.message || messageResponse.data?.message
      );
      
      console.log('🔑 Authentication response:', authResponse);
      if (authResponse && (authResponse.token || authResponse.data?.token)) {
        // Store token and update state
        setAuthToken(authResponse.token || authResponse.data?.token);
        this.state.isAuthenticated = true;
        this.state.user = authResponse.user || authResponse.data?.user;
        
        // Connect WebSocket
        const ws = getDepinWebSocket();
        if (ws) ws.connect();
        
        // Load initial data
        await this.loadInitialData();
        
        this.notifyListeners();
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Wallet authentication failed:', error);
      this.setError('auth', error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      this.setLoading('auth', false);
    }
  }

  private logout() {
    clearAuthToken();
    const ws = getDepinWebSocket();
    if (ws) ws.disconnect();
    
    this.state.isAuthenticated = false;
    this.state.user = null;
    this.state.projects = [];
    this.state.nodes = [];
    this.state.dashboardStats = null;
    
    // Clear all errors
    Object.keys(this.state.errors).forEach(key => {
      this.state.errors[key as keyof typeof this.state.errors] = null;
    });
    
    this.notifyListeners();
  }

  private async loadInitialData() {
    // Load projects always (no auth required)
    const promises = [this.loadProjects()];
    
    // Load authenticated data only if authenticated
    if (this.state.isAuthenticated) {
      promises.push(
        this.loadNodes(),
        this.loadDashboardStats(),
        this.loadEarnings()
      );
    }
    
    // Load data in parallel
    await Promise.all(promises);
  }

  private setupWebSocketListeners() {
    const ws = getDepinWebSocket();
    if (!ws) return;
    
    ws.on('node_update', (data: any) => {
      console.log('Received node update:', data);
      this.refreshNodes();
    });
    
    ws.on('capacity_update', (data: any) => {
      console.log('Received capacity update:', data);
      this.updateNodeCapacity(data.nodeId, data.capacity);
    });
    
    ws.on('performance_update', (data: any) => {
      console.log('Received performance update:', data);
      this.refreshNodes();
    });
    
    ws.on('system_status', (data: any) => {
      console.log('System status:', data.message);
    });
  }

  // Public API methods
  async connectWallet(): Promise<void> {
    await walletUtils.connect();
  }

  async disconnectWallet(): Promise<void> {
    await walletUtils.disconnect();
    this.logout();
  }

  async loadProjects(): Promise<void> {
    try {
      this.setLoading('projects', true);
      this.setError('projects', null);
      
      console.log('🔍 Loading projects...');
      const response = await projectsApi.getProjects();
      console.log('📦 Projects API response:', response);
      
      // 直接使用响应数据，因为 apiRequest 已经处理了 success 检查
      if (Array.isArray(response)) {
        this.state.projects = response;
        console.log('✅ Projects loaded successfully:', response.length, 'projects');
        this.notifyListeners();
      } else if (response && typeof response === 'object' && 'data' in response) {
        // 如果响应包含 data 字段，使用 data
        this.state.projects = Array.isArray(response.data) ? response.data : [];
        console.log('✅ Projects loaded from data field:', this.state.projects.length, 'projects');
        this.notifyListeners();
      } else {
        console.log('⚠️ No projects data available, using empty array');
        // 如果没有数据，设置空数组，这样页面至少能显示
        this.state.projects = [];
        this.notifyListeners();
      }
    } catch (error) {
      console.error('❌ Failed to load projects:', error);
      // 即使出错，也设置空数组，让页面能正常显示
      this.state.projects = [];
      this.setError('projects', error instanceof Error ? error.message : 'Failed to load projects');
      this.notifyListeners();
    } finally {
      this.setLoading('projects', false);
    }
  }

  async loadNodes(): Promise<void> {
    if (!this.state.isAuthenticated) return;
    
    try {
      this.setLoading('nodes', true);
      this.setError('nodes', null);
      
      console.log('🔍 Loading nodes...');
      const response = await nodesApi.getNodes();
      console.log('🎯 Nodes API response:', response);
      
      // 直接使用响应数据，因为 apiRequest 已经处理了 success 检查
      if (Array.isArray(response)) {
        this.state.nodes = response;
        console.log('✅ Nodes loaded successfully:', response.length, 'nodes');
        this.notifyListeners();
      } else if (response && typeof response === 'object' && 'data' in response) {
        // 如果响应包含 data 字段，使用 data
        this.state.nodes = Array.isArray(response.data) ? response.data : [];
        console.log('✅ Nodes loaded from data field:', this.state.nodes.length, 'nodes');
        this.notifyListeners();
      } else {
        console.log('⚠️ No nodes data available, using empty array');
        this.state.nodes = [];
        this.notifyListeners();
      }
    } catch (error) {
      console.error('❌ Failed to load nodes:', error);
      this.state.nodes = [];
      this.setError('nodes', error instanceof Error ? error.message : 'Failed to load nodes');
      this.notifyListeners();
    } finally {
      this.setLoading('nodes', false);
    }
  }

  async loadDashboardStats(): Promise<void> {
    if (!this.state.isAuthenticated) return;
    
    try {
      this.setLoading('dashboard', true);
      this.setError('dashboard', null);
      
      console.log('📊 Loading dashboard stats...');
      const response = await dashboardApi.getStats();
      console.log('📈 Dashboard stats API response:', response);
      
      // 直接使用响应数据，因为 apiRequest 已经处理了 success 检查
      if (response && typeof response === 'object') {
        this.state.dashboardStats = response;
        console.log('✅ Dashboard stats loaded successfully');
        this.notifyListeners();
      } else {
        console.log('⚠️ No dashboard stats data available');
        this.state.dashboardStats = null;
        this.notifyListeners();
      }
    } catch (error) {
      console.error('❌ Failed to load dashboard stats:', error);
      this.state.dashboardStats = null;
      this.setError('dashboard', error instanceof Error ? error.message : 'Failed to load dashboard stats');
      this.notifyListeners();
    } finally {
      this.setLoading('dashboard', false);
    }
  }

  async loadEarnings(period: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<void> {
    if (!this.state.isAuthenticated) return;
    
    try {
      this.setLoading('earnings', true);
      this.setError('earnings', null);
      
      console.log('💰 Loading earnings data...');
      const response = await dashboardApi.getEarnings(period);
      console.log('💵 Earnings API response:', response);
      
      // 直接使用响应数据，因为 apiRequest 已经处理了 success 检查
      if (response && typeof response === 'object') {
        this.state.earnings = response;
        console.log('✅ Earnings loaded successfully');
        this.notifyListeners();
      } else {
        console.log('⚠️ No earnings data available');
        this.state.earnings = null;
        this.notifyListeners();
      }
    } catch (error) {
      console.error('❌ Failed to load earnings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load earnings';
      
      // 对于超时错误，保持现有数据但显示友好错误信息
      if (errorMessage.includes('超时')) {
        console.log('⏰ Earnings request timeout, keeping existing data');
        this.setError('earnings', '收益数据加载超时，正在重试...');
        // 不清除现有的 earnings 数据
      } else {
        this.state.earnings = null;
        this.setError('earnings', errorMessage);
      }
      this.notifyListeners();
    } finally {
      this.setLoading('earnings', false);
    }
  }

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
  }): Promise<{ success: boolean; message: string; data?: any }> {
    if (!this.state.isAuthenticated) {
      return { success: false, message: 'Not authenticated' };
    }

    try {
      console.log('🚀 Creating nodes:', data);
      const response = await nodesApi.createNodes(data);
      console.log('✨ Create nodes API response:', response);
      
      // 直接使用响应数据，因为 apiRequest 已经处理了 success 检查
      if (response && typeof response === 'object' && response.summary) {
        // Refresh nodes list
        await this.loadNodes();
        
        const summary = response.summary;
        return {
          success: true,
          message: `Successfully created ${summary.created} of ${summary.total} nodes`,
          data: response
        };
      } else {
        return { success: false, message: 'Unexpected response format' };
      }
    } catch (error) {
      console.error('❌ Failed to create nodes:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to create nodes' 
      };
    }
  }

  async deleteNode(nodeId: string): Promise<boolean> {
    if (!this.state.isAuthenticated) return false;

    try {
      const response = await nodesApi.deleteNode(nodeId);
      console.log('🗑️ Delete node response:', response);
      // 对于删除操作，通常返回 null 或空对象表示成功
      // Remove from local state
      this.state.nodes = this.state.nodes.filter(node => node.id !== nodeId);
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Failed to delete node:', error);
      return false;
    }
  }

  async deleteProject(projectId: string): Promise<boolean> {
    if (!this.state.isAuthenticated) return false;

    try {
      const response = await projectsApi.deleteProject(projectId);
      console.log('🗑️ Delete project response:', response);
      // 对于删除操作，通常返回 null 或空对象表示成功
      // Remove from local state
      this.state.projects = this.state.projects.filter(project => project.id !== projectId);
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Failed to delete project:', error);
      return false;
    }
  }

  async refreshNodes(): Promise<void> {
    await this.loadNodes();
  }

  async refreshProjects(): Promise<void> {
    await this.loadProjects();
  }

  async refreshDashboard(): Promise<void> {
    await this.loadDashboardStats();
  }

  async refreshEarnings(): Promise<void> {
    await this.loadEarnings();
  }

  async refreshFilecoinEarnings(): Promise<void> {
    // 专门刷新 Filecoin 相关的数据
    try {
      // 首先触发容量和收益更新
      await this.triggerCapacityUpdate();
      
      // 等待2秒后再刷新数据，确保后端处理完成
      setTimeout(async () => {
        await Promise.all([
          this.loadNodes(), // 刷新节点数据（包含收益信息）
          this.loadEarnings(), // 刷新收益摘要
          this.loadDashboardStats() // 刷新仪表板统计
        ]);
      }, 2000);
    } catch (error) {
      console.error('Failed to refresh Filecoin earnings:', error);
      // 即使触发更新失败，也要刷新数据
      await Promise.all([
        this.loadNodes(),
        this.loadEarnings(),
        this.loadDashboardStats()
      ]);
    }
  }

  async refreshAll(): Promise<void> {
    await this.loadInitialData();
  }

  async triggerCapacityUpdate(): Promise<{ success: boolean; message: string }> {
    if (!this.state.isAuthenticated) {
      return { success: false, message: 'Not authenticated' };
    }

    try {
      const response = await dashboardApi.triggerCapacityUpdate();
      console.log('⚡ Capacity update response:', response);
      if (response && typeof response === 'object') {
        // Refresh nodes to get updated capacities
        setTimeout(() => this.loadNodes(), 2000);
        
        return {
          success: true,
          message: `Capacity update completed: ${response.totalUpdated || 0} updated, ${response.totalFailed || 0} failed`
        };
      }
      return { success: false, message: 'Capacity update failed' };
    } catch (error) {
      console.error('Failed to trigger capacity update:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Capacity update failed' 
      };
    }
  }

  private updateNodeCapacity(nodeId: string, capacity: string): void {
    const nodeIndex = this.state.nodes.findIndex(node => node.nodeId === nodeId);
    if (nodeIndex > -1) {
      this.state.nodes[nodeIndex].capacity = capacity;
      this.notifyListeners();
    }
  }

  // State management helpers
  private setLoading(key: keyof ApiDePINStore['loading'], value: boolean): void {
    this.state.loading[key] = value;
    this.notifyListeners();
  }

  private setError(key: keyof ApiDePINStore['errors'], value: string | null): void {
    this.state.errors[key] = value;
    this.notifyListeners();
  }

  // Listener management
  subscribe(listener: () => void): () => void {
    this.state.listeners.add(listener);
    return () => {
      this.state.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.state.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in store listener:', error);
      }
    });
  }

  // Getters
  getState(): ApiDePINStore {
    return { ...this.state };
  }

  getProjects(): DePINProject[] {
    return this.state.projects;
  }

  getNodes(): UserNode[] {
    return this.state.nodes;
  }

  getDashboardStats(): DashboardStats | null {
    return this.state.dashboardStats;
  }

  isLoading(): boolean {
    return Object.values(this.state.loading).some(loading => loading);
  }

  getErrors(): Record<string, string | null> {
    return { ...this.state.errors };
  }

  isAuthenticated(): boolean {
    return this.state.isAuthenticated;
  }

  getUser(): any | null {
    return this.state.user;
  }
}

// Create singleton instance
export const apiDePINStore = new ApiDePINStoreClass();