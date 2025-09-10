/**
 * 交易日志服务 - 前端与后端API交互
 */

// Journal API uses Next.js API routes, not the backend server
const getJournalApiBase = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }
  return '/api';
};

// Simple auth token management for journal service
const getJournalAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('wallet_address') || null;
  }
  return null;
};

export interface JournalEntry {
  id: string;
  walletAddress: string;
  userId?: string;
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  tags: string[];
  folderId?: string;
  tradeData?: {
    symbol?: string;
    entryPrice?: number;
    exitPrice?: number;
    quantity?: number;
    pnl?: number;
    pnlPercentage?: number;
    tradeType?: 'spot' | 'futures' | 'defi';
  };
  imageUrls?: string[];
  isPublic: boolean;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  createdAt: string;
  updatedAt: string;
}

export interface JournalStats {
  totalEntries: number;
  thisWeekCount: number;
  categories: Array<{ category: string; count: number }>;
  sentiment: Array<{ sentiment: string; count: number }>;
}

export class JournalService {
  private static getHeaders(): HeadersInit {
    const walletAddress = getJournalAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(walletAddress && { 'X-Wallet-Address': walletAddress })
    };
  }

  /**
   * 获取用户的所有日志条目
   */
  static async getEntries(params?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ entries: JournalEntry[]; total: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }

      const response = await fetch(
        `${getJournalApiBase()}/journal/entries?${queryParams}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch journal entries: ${response.status}`);
      }

      const result = await response.json();
      return result.data || { entries: [], total: 0 };
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      throw error;
    }
  }

  /**
   * 获取单个日志条目
   */
  static async getEntry(id: string): Promise<JournalEntry | null> {
    try {
      const response = await fetch(
        `${getJournalApiBase()}/journal/entries/${id}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch journal entry: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching journal entry:', error);
      throw error;
    }
  }

  /**
   * 创建新的日志条目
   */
  static async createEntry(data: Omit<JournalEntry, 'id' | 'walletAddress' | 'userId' | 'createdAt' | 'updatedAt' | 'excerpt'>): Promise<JournalEntry> {
    try {
      const response = await fetch(
        `${getJournalApiBase()}/journal/entries`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(data)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to create journal entry: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error creating journal entry:', error);
      throw error;
    }
  }

  /**
   * 更新日志条目
   */
  static async updateEntry(id: string, data: Partial<Omit<JournalEntry, 'id' | 'walletAddress' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<JournalEntry> {
    try {
      const response = await fetch(
        `${getJournalApiBase()}/journal/entries/${id}`,
        {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(data)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to update journal entry: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error updating journal entry:', error);
      throw error;
    }
  }

  /**
   * 删除日志条目
   */
  static async deleteEntry(id: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${getJournalApiBase()}/journal/entries/${id}`,
        {
          method: 'DELETE',
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete journal entry: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      throw error;
    }
  }

  /**
   * 获取日志统计信息
   */
  static async getStats(): Promise<JournalStats> {
    try {
      const response = await fetch(
        `${getJournalApiBase()}/journal/stats`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch journal stats: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching journal stats:', error);
      throw error;
    }
  }

  /**
   * 导出所有日志条目
   */
  static async exportEntries(): Promise<JournalEntry[]> {
    try {
      const response = await fetch(
        `${getJournalApiBase()}/journal/export`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to export journal entries: ${response.status}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error exporting journal entries:', error);
      throw error;
    }
  }

  /**
   * 导入日志条目（批量创建）
   */
  static async importEntries(entries: Array<Omit<JournalEntry, 'id' | 'walletAddress' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<{ imported: number; failed: number }> {
    try {
      let imported = 0;
      let failed = 0;

      for (const entry of entries) {
        try {
          await this.createEntry(entry);
          imported++;
        } catch (error) {
          console.error('Failed to import entry:', entry.title, error);
          failed++;
        }
      }

      return { imported, failed };
    } catch (error) {
      console.error('Error importing journal entries:', error);
      throw error;
    }
  }

  /**
   * 获取钱包地址特定的缓存键名
   */
  private static getCacheKey(key: string): string {
    const walletAddress = getJournalAuthToken();
    if (walletAddress) {
      return `${key}_${walletAddress.slice(-8)}`;
    }
    return key;
  }

  /**
   * 本地存储缓存（用于离线支持，按钱包地址隔离）
   */
  static getLocalCache(): JournalEntry[] {
    if (typeof window === 'undefined') return [];
    try {
      const cacheKey = this.getCacheKey('journal_cache');
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const entries = JSON.parse(cached);
        console.log('📖 Cache loaded:', {
          walletAddress: getJournalAuthToken(),
          cacheKey,
          entryCount: entries.length,
          dataSize: cached.length,
          firstEntry: entries[0] ? { id: entries[0].id, title: entries[0].title, createdAt: entries[0].createdAt } : null,
          rawDataPreview: cached.substring(0, 100) + '...'
        });
        return entries;
      } else {
        console.log('📖 No cache found for key:', cacheKey);
        return [];
      }
    } catch (error) {
      console.error('Error reading journal cache:', error);
      return [];
    }
  }

  static setLocalCache(entries: JournalEntry[]): void {
    if (typeof window === 'undefined') return;
    try {
      const cacheKey = this.getCacheKey('journal_cache');
      const dataString = JSON.stringify(entries);
      localStorage.setItem(cacheKey, dataString);
      console.log('💾 Cache saved:', {
        walletAddress: getJournalAuthToken(),
        cacheKey,
        entryCount: entries.length,
        dataSize: dataString.length,
        firstEntry: entries[0] ? { id: entries[0].id, title: entries[0].title } : null
      });
      
      // 立即验证保存是否成功
      const verification = localStorage.getItem(cacheKey);
      if (verification) {
        const verificationData = JSON.parse(verification);
        console.log('✅ Cache save verification passed:', verificationData.length);
      } else {
        console.error('❌ Cache save verification failed - no data found');
      }
    } catch (error) {
      console.error('Error setting journal cache:', error);
    }
  }

  static clearLocalCache(): void {
    if (typeof window === 'undefined') return;
    try {
      const cacheKey = this.getCacheKey('journal_cache');
      localStorage.removeItem(cacheKey);
      console.log('🗑️ Journal cache cleared successfully for key:', cacheKey);
    } catch (error) {
      console.error('Error clearing journal cache:', error);
    }
  }

  // 清空所有相关的localStorage数据（只清理当前钱包地址的数据）
  static clearAllLocalData(): void {
    if (typeof window === 'undefined') return;
    try {
      const walletAddress = getJournalAuthToken();
      const suffix = walletAddress ? `_${walletAddress.slice(-8)}` : '';
      
      // 清空当前钱包地址的所有日志相关数据
      const keysToRemove = [
        `journal_cache${suffix}`,
        `journal_folders${suffix}`,
        `journal_stats${suffix}`
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log('🗑️ Removed localStorage key:', key);
      });
      
      console.log('🗑️ All journal data cleared from localStorage for wallet:', walletAddress || 'anonymous');
    } catch (error) {
      console.error('Error clearing all journal data:', error);
    }
  }

  // 清理所有钱包的journal数据（用于全局重置）
  static clearAllWalletsData(): void {
    if (typeof window === 'undefined') return;
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.includes('journal_cache') || key.includes('journal_folders') || key.includes('journal_stats')) {
          localStorage.removeItem(key);
          console.log('🗑️ Removed localStorage key:', key);
        }
      });
      console.log('🗑️ All journal data cleared for all wallets');
    } catch (error) {
      console.error('Error clearing all wallets journal data:', error);
    }
  }
}