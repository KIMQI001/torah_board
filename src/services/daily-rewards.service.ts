/**
 * Daily Rewards Service - 前端每日奖励服务
 */

import { getApiBaseUrl } from '@/lib/api';

const getApiBase = () => getApiBaseUrl().replace('/api/v1', '');

interface WeeklyRewards {
  totalUSD: number;
  breakdown: Record<string, { amount: number; usd: number }>;
  averageDaily: number;
}

interface DailyReward {
  id: string;
  userId: string;
  date: string;
  totalRewardsUSD: number;
  breakdown: Record<string, { amount: number; price: number; usd: number }>;
  nodeCount: number;
  createdAt: string;
  updatedAt: string;
}

export class DailyRewardsService {
  
  /**
   * 获取用户每周奖励（滚动7天）
   */
  static async getWeeklyRewards(userId: string, days: number = 7): Promise<WeeklyRewards> {
    try {
      const response = await fetch(
        `${getApiBase()}/api/v1/daily-rewards/weekly/${userId}?days=${days}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch weekly rewards: ${response.status}`);
      }

      const result = await response.json();
      return result.data || { totalUSD: 0, breakdown: {}, averageDaily: 0 };
    } catch (error) {
      console.error('Error fetching weekly rewards:', error);
      return { totalUSD: 0, breakdown: {}, averageDaily: 0 };
    }
  }

  /**
   * 获取用户奖励历史记录
   */
  static async getRewardsHistory(userId: string, days: number = 30): Promise<DailyReward[]> {
    try {
      const response = await fetch(
        `${getApiBase()}/api/v1/daily-rewards/history/${userId}?days=${days}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch rewards history: ${response.status}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching rewards history:', error);
      return [];
    }
  }

  /**
   * 手动触发每日奖励记录
   */
  static async triggerRecording(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(
        `${getApiBase()}/api/v1/daily-rewards/trigger-recording`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      
      return {
        success: response.ok,
        message: result.message || 'Recording triggered'
      };
    } catch (error) {
      console.error('Error triggering recording:', error);
      return {
        success: false,
        message: `Failed to trigger recording: ${error.message}`
      };
    }
  }

  /**
   * 记录今天的奖励（用于测试）
   */
  static async recordToday(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(
        `${getApiBase()}/api/v1/daily-rewards/record-today`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      
      return {
        success: response.ok,
        message: result.message || 'Today\'s rewards recorded'
      };
    } catch (error) {
      console.error('Error recording today\'s rewards:', error);
      return {
        success: false,
        message: `Failed to record today's rewards: ${error.message}`
      };
    }
  }
}