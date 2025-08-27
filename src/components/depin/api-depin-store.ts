// DePIN store using real API instead of localStorage

import { 
  projectsApi, 
  nodesApi, 
  dashboardApi, 
  authApi, 
  setAuthToken, 
  getAuthToken,
  clearAuthToken,
  depinWebSocket,
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
  }

  private async initializeAuth() {
    const token = getAuthToken();
    if (token) {
      try {
        this.setLoading('auth', true);
        const response = await authApi.verify();
        if (response.success) {
          this.state.isAuthenticated = true;
          this.state.user = response.data.user;
          
          // Connect WebSocket
          depinWebSocket.connect();
          
          // Load initial data
          this.loadInitialData();
        }
      } catch (error) {
        console.error('Authentication verification failed:', error);
        clearAuthToken();
        this.state.isAuthenticated = false;
        this.state.user = null;
      } finally {
        this.setLoading('auth', false);
      }
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
      if (!messageResponse.success) {
        throw new Error('Failed to generate auth message');
      }
      
      // Step 2: Sign the message
      const signature = await walletUtils.signMessage(messageResponse.data.message);
      
      // Step 3: Authenticate with backend
      const authResponse = await authApi.authenticate(
        connection.walletAddress,
        connection.publicKey,
        signature,
        messageResponse.data.message
      );
      
      if (authResponse.success) {
        // Store token and update state
        setAuthToken(authResponse.data.token);
        this.state.isAuthenticated = true;
        this.state.user = authResponse.data.user;
        
        // Connect WebSocket
        depinWebSocket.connect();
        
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
    depinWebSocket.disconnect();
    
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
    if (!this.state.isAuthenticated) return;
    
    // Load data in parallel
    await Promise.all([
      this.loadProjects(),
      this.loadNodes(),
      this.loadDashboardStats(),
      this.loadEarnings()
    ]);
  }

  private setupWebSocketListeners() {
    depinWebSocket.on('node_update', (data: any) => {
      console.log('Received node update:', data);
      this.refreshNodes();
    });
    
    depinWebSocket.on('capacity_update', (data: any) => {
      console.log('Received capacity update:', data);
      this.updateNodeCapacity(data.nodeId, data.capacity);
    });
    
    depinWebSocket.on('performance_update', (data: any) => {
      console.log('Received performance update:', data);
      this.refreshNodes();
    });
    
    depinWebSocket.on('system_status', (data: any) => {
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
      
      const response = await projectsApi.getProjects();
      if (response.success) {
        this.state.projects = response.data;
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      this.setError('projects', 'Failed to load projects');
    } finally {
      this.setLoading('projects', false);
    }
  }

  async loadNodes(): Promise<void> {
    if (!this.state.isAuthenticated) return;
    
    try {
      this.setLoading('nodes', true);
      this.setError('nodes', null);
      
      const response = await nodesApi.getNodes();
      if (response.success) {
        this.state.nodes = response.data;
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to load nodes:', error);
      this.setError('nodes', 'Failed to load nodes');
    } finally {
      this.setLoading('nodes', false);
    }
  }

  async loadDashboardStats(): Promise<void> {
    if (!this.state.isAuthenticated) return;
    
    try {
      this.setLoading('dashboard', true);
      this.setError('dashboard', null);
      
      const response = await dashboardApi.getStats();
      if (response.success) {
        this.state.dashboardStats = response.data;
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      this.setError('dashboard', 'Failed to load dashboard stats');
    } finally {
      this.setLoading('dashboard', false);
    }
  }

  async loadEarnings(period: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<void> {
    if (!this.state.isAuthenticated) return;
    
    try {
      this.setLoading('earnings', true);
      this.setError('earnings', null);
      
      const response = await dashboardApi.getEarnings(period);
      if (response.success) {
        this.state.earnings = response.data;
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to load earnings:', error);
      this.setError('earnings', 'Failed to load earnings');
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
      const response = await nodesApi.createNodes(data);
      if (response.success) {
        // Refresh nodes list
        await this.loadNodes();
        
        const summary = response.data.summary;
        return {
          success: true,
          message: `Successfully created ${summary.created} of ${summary.total} nodes`,
          data: response.data
        };
      } else {
        return { success: false, message: 'Failed to create nodes' };
      }
    } catch (error) {
      console.error('Failed to create nodes:', error);
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
      if (response.success) {
        // Remove from local state
        this.state.nodes = this.state.nodes.filter(node => node.id !== nodeId);
        this.notifyListeners();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete node:', error);
      return false;
    }
  }

  async deleteProject(projectId: string): Promise<boolean> {
    if (!this.state.isAuthenticated) return false;

    try {
      const response = await projectsApi.deleteProject(projectId);
      if (response.success) {
        // Remove from local state
        this.state.projects = this.state.projects.filter(project => project.id !== projectId);
        this.notifyListeners();
        return true;
      }
      return false;
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
      if (response.success) {
        // Refresh nodes to get updated capacities
        setTimeout(() => this.loadNodes(), 2000);
        
        return {
          success: true,
          message: `Capacity update completed: ${response.data.totalUpdated} updated, ${response.data.totalFailed} failed`
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