/**
 * 交易日志服务 - 前端与后端API交互
 */

import { getAuthToken, getApiBaseUrl } from '@/lib/api';

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
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
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
        `${getApiBaseUrl()}/journal/entries?${queryParams}`,
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
        `${getApiBaseUrl()}/journal/entries/${id}`,
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
        `${getApiBaseUrl()}/journal/entries`,
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
        `${getApiBaseUrl()}/journal/entries/${id}`,
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
        `${getApiBaseUrl()}/journal/entries/${id}`,
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
        `${getApiBaseUrl()}/journal/stats`,
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
        `${getApiBaseUrl()}/journal/export`,
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
   * 本地存储缓存（用于离线支持）
   */
  static getLocalCache(): JournalEntry[] {
    if (typeof window === 'undefined') return [];
    try {
      const cached = localStorage.getItem('journal_cache');
      if (cached) {
        const entries = JSON.parse(cached);
        console.log('📖 Cache loaded:', {
          entryCount: entries.length,
          dataSize: cached.length,
          firstEntry: entries[0] ? { id: entries[0].id, title: entries[0].title, createdAt: entries[0].createdAt } : null,
          rawDataPreview: cached.substring(0, 100) + '...'
        });
        return entries;
      } else {
        console.log('📖 No cache found');
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
      const dataString = JSON.stringify(entries);
      localStorage.setItem('journal_cache', dataString);
      console.log('💾 Cache saved:', {
        entryCount: entries.length,
        dataSize: dataString.length,
        firstEntry: entries[0] ? { id: entries[0].id, title: entries[0].title } : null
      });
      
      // 立即验证保存是否成功
      const verification = localStorage.getItem('journal_cache');
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
      localStorage.removeItem('journal_cache');
      console.log('🗑️ Journal cache cleared successfully');
    } catch (error) {
      console.error('Error clearing journal cache:', error);
    }
  }

  // 清空所有相关的localStorage数据
  static clearAllLocalData(): void {
    if (typeof window === 'undefined') return;
    try {
      // 清空日志缓存
      localStorage.removeItem('journal_cache');
      // 清空文件夹数据
      localStorage.removeItem('journal_folders');
      // 清空其他可能相关的缓存
      localStorage.removeItem('journal_stats');
      console.log('🗑️ All journal data cleared from localStorage');
    } catch (error) {
      console.error('Error clearing all journal data:', error);
    }
  }
}