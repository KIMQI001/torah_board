const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002/api/v1';

export interface ActiveAirdrop {
  id: string;
  project: string;
  chain: string;
  deadline?: string;
  requirements: string;
  estimatedValue: string;
  category: string;
  difficulty: string;
  status: string;
  officialUrl?: string;
  twitterUrl?: string;
  discordUrl?: string;
  description?: string;
  tags: string; // JSON string
  isHot: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserAirdropProject {
  id: string;
  userId: string;
  walletAddress: string;
  airdropId: string;
  project: string;
  chain: string;
  accountCount: number;
  ipCount: number;
  status: string;
  progressNotes?: string;
  claimedDate?: string;
  claimedAmount?: string;
  estimatedValue?: string;
  actualValue?: string;
  txHash?: string;
  createdAt: string;
  updatedAt: string;
  airdrop?: ActiveAirdrop;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export class AirdropAPI {
  /**
   * 获取活跃空投列表
   */
  static async getActiveAirdrops(params?: {
    chain?: string;
    status?: string;
    isHot?: boolean;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<ActiveAirdrop>> {
    try {
      const queryString = params ? new URLSearchParams(
        Object.entries(params).reduce((acc, [key, value]) => {
          if (value !== undefined) {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>)
      ).toString() : '';

      const url = `${API_BASE_URL}/airdrop/active?${queryString}`;
      console.log('Fetching airdrops from:', url);

      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('HTTP error:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<PaginatedResponse<ActiveAirdrop>> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      return result.data;
    } catch (error) {
      console.error('Error fetching active airdrops:', error);
      
      // 返回空数据以防止页面崩溃
      return {
        data: [],
        total: 0,
        limit: 20,
        offset: 0,
        hasMore: false
      };
    }
  }

  /**
   * 创建活跃空投项目
   */
  static async createActiveAirdrop(data: Omit<ActiveAirdrop, 'id' | 'createdAt' | 'updatedAt'>): Promise<ActiveAirdrop> {
    const response = await fetch(`${API_BASE_URL}/airdrop/active`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: ApiResponse<ActiveAirdrop> = await response.json();
    
    if (!result.success) {
      throw new Error(result.message);
    }
    
    return result.data;
  }

  /**
   * 更新活跃空投项目
   */
  static async updateActiveAirdrop(id: string, data: Partial<ActiveAirdrop>): Promise<ActiveAirdrop> {
    const response = await fetch(`${API_BASE_URL}/airdrop/active/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: ApiResponse<ActiveAirdrop> = await response.json();
    
    if (!result.success) {
      throw new Error(result.message);
    }
    
    return result.data;
  }

  /**
   * 删除活跃空投项目
   */
  static async deleteActiveAirdrop(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/airdrop/active/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: ApiResponse<boolean> = await response.json();
    
    if (!result.success) {
      throw new Error(result.message);
    }
    
    return result.data;
  }

  /**
   * 获取用户空投项目列表
   */
  static async getUserAirdropProjects(params?: {
    walletAddress?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<UserAirdropProject>> {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';

    const response = await fetch(`${API_BASE_URL}/airdrop/user-projects?${queryString}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: ApiResponse<PaginatedResponse<UserAirdropProject>> = await response.json();
    
    if (!result.success) {
      throw new Error(result.message);
    }
    
    return result.data;
  }

  /**
   * 创建用户空投项目
   */
  static async createUserAirdropProject(data: {
    walletAddress: string;
    airdropId: string;
    project: string;
    chain: string;
    accountCount: number;
    ipCount: number;
    status?: string;
    progressNotes?: string;
  }): Promise<UserAirdropProject> {
    const response = await fetch(`${API_BASE_URL}/airdrop/user-projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: ApiResponse<UserAirdropProject> = await response.json();
    
    if (!result.success) {
      throw new Error(result.message);
    }
    
    return result.data;
  }

  /**
   * 更新用户空投项目
   */
  static async updateUserAirdropProject(id: string, data: Partial<UserAirdropProject>): Promise<UserAirdropProject> {
    const response = await fetch(`${API_BASE_URL}/airdrop/user-projects/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: ApiResponse<UserAirdropProject> = await response.json();
    
    if (!result.success) {
      throw new Error(result.message);
    }
    
    return result.data;
  }

  /**
   * 删除用户空投项目
   */
  static async deleteUserAirdropProject(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/airdrop/user-projects/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: ApiResponse<boolean> = await response.json();
    
    if (!result.success) {
      throw new Error(result.message);
    }
    
    return result.data;
  }

  /**
   * 根据钱包地址获取用户项目
   */
  static async getUserProjectsByWallet(walletAddress: string): Promise<PaginatedResponse<UserAirdropProject>> {
    const response = await fetch(`${API_BASE_URL}/airdrop/wallet/${walletAddress}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: ApiResponse<PaginatedResponse<UserAirdropProject>> = await response.json();
    
    if (!result.success) {
      throw new Error(result.message);
    }
    
    return result.data;
  }

  /**
   * 获取空投统计信息
   */
  static async getAirdropStats(): Promise<{
    totalActive: number;
    hotProjects: number;
    chainDistribution: Record<string, number>;
    categoryDistribution: Record<string, number>;
    lastUpdated: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/airdrop/stats`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: ApiResponse<any> = await response.json();
    
    if (!result.success) {
      throw new Error(result.message);
    }
    
    return result.data;
  }
}