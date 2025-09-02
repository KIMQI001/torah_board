import { Logger } from '@/utils/logger';
import { prisma } from '@/services/database';

export interface OnChainEvent {
  transactionHash: string;
  blockNumber: bigint;
  blockchain: string;
  eventType: string;
  title: string;
  description: string;
  amount?: string;
  tokenSymbol?: string;
  tokenAddress?: string;
  fromAddress?: string;
  toAddress?: string;
  dexName?: string;
  nftCollection?: string;
  value?: number;
  gasUsed?: string;
  gasPrice?: string;
  metadata?: Record<string, any>;
  isAlert: boolean;
  timestamp: Date;
}

export interface FeedFilter {
  blockchain?: string;
  eventType?: string;
  minValue?: number;
  tokenSymbol?: string;
  alertsOnly?: boolean;
  limit?: number;
  offset?: number;
}

export class OnChainFeedsService {
  private static readonly WHALE_THRESHOLD = 1000000; // $1M USD
  private static readonly LARGE_TRANSFER_THRESHOLD = 100000; // $100K USD

  /**
   * 生成模拟链上数据快讯（类似Lookonchain）
   */
  static async generateMockOnChainFeeds(): Promise<OnChainEvent[]> {
    const mockFeeds: OnChainEvent[] = [];
    const now = new Date();

    // 模拟大额转账
    const largeTransfers = [
      {
        tokenSymbol: 'WETH',
        amount: '1,250,000',
        value: 3250000,
        fromAddress: '0x1234...abcd',
        toAddress: '0x5678...efgh',
        blockchain: 'ethereum',
        title: 'Whale Alert: Large WETH Transfer',
        description: '🐋 A whale just transferred 1.25M WETH ($3.25M) from unknown wallet to Binance',
        eventType: 'large_transfer',
        isAlert: true
      },
      {
        tokenSymbol: 'BTC',
        amount: '45.67',
        value: 2100000,
        fromAddress: 'bc1q...xyz',
        toAddress: 'bc1q...abc',
        blockchain: 'bitcoin',
        title: 'Bitcoin Whale Movement',
        description: '🚨 45.67 BTC ($2.1M) moved from dormant address (inactive for 3 years)',
        eventType: 'whale_activity',
        isAlert: true
      }
    ];

    // 模拟DEX交易
    const dexSwaps = [
      {
        tokenSymbol: 'SOL',
        amount: '50,000',
        value: 750000,
        dexName: 'Uniswap V3',
        blockchain: 'ethereum',
        title: 'Large DEX Swap Detected',
        description: '💰 Someone just swapped 50K SOL for USDC on Uniswap V3 ($750K)',
        eventType: 'dex_swap',
        isAlert: false
      },
      {
        tokenSymbol: 'PEPE',
        amount: '100,000,000,000',
        value: 450000,
        dexName: 'Jupiter',
        blockchain: 'solana',
        title: 'Memecoin Action',
        description: '🐸 Massive PEPE trade: 100B PEPE → USDC on Jupiter ($450K)',
        eventType: 'dex_swap',
        isAlert: false
      }
    ];

    // 模拟NFT交易
    const nftTrades = [
      {
        nftCollection: 'Bored Ape Yacht Club',
        tokenSymbol: 'ETH',
        amount: '25.5',
        value: 58000,
        blockchain: 'ethereum',
        title: 'High-Value NFT Sale',
        description: '🎨 Bored Ape #3547 sold for 25.5 ETH ($58K) on OpenSea',
        eventType: 'nft_trade',
        isAlert: false
      }
    ];

    // 随机选择一些事件
    const allEvents = [...largeTransfers, ...dexSwaps, ...nftTrades];
    const selectedEvents = allEvents.slice(0, Math.floor(Math.random() * 4) + 2);

    selectedEvents.forEach((event, index) => {
      const timestamp = new Date(now.getTime() - index * 15 * 60 * 1000); // 15分钟间隔
      
      mockFeeds.push({
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        blockNumber: BigInt(Math.floor(Math.random() * 1000000) + 18000000),
        blockchain: event.blockchain,
        eventType: event.eventType,
        title: event.title,
        description: event.description,
        amount: event.amount,
        tokenSymbol: event.tokenSymbol,
        tokenAddress: event.tokenSymbol ? `0x${Math.random().toString(16).substr(2, 40)}` : undefined,
        fromAddress: event.fromAddress,
        toAddress: event.toAddress,
        dexName: event.dexName,
        nftCollection: event.nftCollection,
        value: event.value,
        gasUsed: Math.floor(Math.random() * 100000 + 21000).toString(),
        gasPrice: (Math.random() * 50 + 10).toFixed(2),
        metadata: {
          explorer: event.blockchain === 'ethereum' ? 'etherscan' : 'solscan',
          network: event.blockchain,
          confidence: Math.random() > 0.5 ? 'high' : 'medium'
        },
        isAlert: event.isAlert,
        timestamp
      });
    });

    return mockFeeds.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * 保存链上数据到数据库
   */
  static async saveOnChainFeeds(feeds: OnChainEvent[]): Promise<void> {
    try {
      for (const feed of feeds) {
        await prisma.onChainFeed.upsert({
          where: {
            transactionHash_blockchain: {
              transactionHash: feed.transactionHash,
              blockchain: feed.blockchain
            }
          },
          update: {
            title: feed.title,
            description: feed.description,
            value: feed.value,
            metadata: JSON.stringify(feed.metadata)
          },
          create: {
            transactionHash: feed.transactionHash,
            blockNumber: feed.blockNumber,
            blockchain: feed.blockchain,
            eventType: feed.eventType,
            title: feed.title,
            description: feed.description,
            amount: feed.amount,
            tokenSymbol: feed.tokenSymbol,
            tokenAddress: feed.tokenAddress,
            fromAddress: feed.fromAddress,
            toAddress: feed.toAddress,
            dexName: feed.dexName,
            nftCollection: feed.nftCollection,
            value: feed.value,
            gasUsed: feed.gasUsed,
            gasPrice: feed.gasPrice,
            metadata: JSON.stringify(feed.metadata || {}),
            isAlert: feed.isAlert,
            timestamp: feed.timestamp
          }
        });
      }

      Logger.info(`Saved ${feeds.length} on-chain feeds to database`);
    } catch (error) {
      Logger.error('Failed to save on-chain feeds', { error });
      throw new Error('Failed to save on-chain feeds to database');
    }
  }

  /**
   * 获取链上数据快讯
   */
  static async getOnChainFeeds(filter?: FeedFilter): Promise<any[]> {
    try {
      const whereClause: any = {};

      if (filter?.blockchain) {
        whereClause.blockchain = filter.blockchain;
      }

      if (filter?.eventType) {
        whereClause.eventType = filter.eventType;
      }

      if (filter?.minValue) {
        whereClause.value = {
          gte: filter.minValue
        };
      }

      if (filter?.tokenSymbol) {
        whereClause.tokenSymbol = {
          equals: filter.tokenSymbol,
          mode: 'insensitive'
        };
      }

      if (filter?.alertsOnly) {
        whereClause.isAlert = true;
      }

      const feeds = await prisma.onChainFeed.findMany({
        where: whereClause,
        orderBy: {
          timestamp: 'desc'
        },
        take: filter?.limit || 50,
        skip: filter?.offset || 0
      });

      return feeds.map(feed => ({
        ...feed,
        blockNumber: feed.blockNumber.toString(), // Convert BigInt to string
        metadata: feed.metadata ? JSON.parse(feed.metadata) : {}
      }));
    } catch (error) {
      Logger.error('Failed to fetch on-chain feeds', { error: error.message, filter });
      throw error;
    }
  }

  /**
   * 获取警报级别的链上事件
   */
  static async getAlertFeeds(): Promise<any[]> {
    return this.getOnChainFeeds({
      alertsOnly: true,
      limit: 20
    });
  }

  /**
   * 获取特定代币相关的链上事件
   */
  static async getTokenRelatedFeeds(tokenSymbol: string): Promise<any[]> {
    return this.getOnChainFeeds({
      tokenSymbol,
      limit: 30
    });
  }

  /**
   * 获取巨鲸活动
   */
  static async getWhaleActivity(): Promise<any[]> {
    return this.getOnChainFeeds({
      eventType: 'whale_activity',
      minValue: this.WHALE_THRESHOLD,
      limit: 15
    });
  }

  /**
   * 定期更新链上数据任务
   */
  static async updateOnChainFeedsTask(): Promise<void> {
    try {
      Logger.info('Starting on-chain feeds update task...');
      
      const mockFeeds = await this.generateMockOnChainFeeds();
      
      if (mockFeeds.length > 0) {
        await this.saveOnChainFeeds(mockFeeds);
        Logger.info(`On-chain feeds update completed: ${mockFeeds.length} new feeds`);
      } else {
        Logger.info('No new on-chain feeds to update');
      }
    } catch (error) {
      Logger.error('On-chain feeds update task failed', { error });
      throw error;
    }
  }

  /**
   * 清理旧的链上数据
   */
  static async cleanupOldFeeds(daysToKeep: number = 7): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const deleteResult = await prisma.onChainFeed.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      });

      Logger.info(`Cleaned up ${deleteResult.count} old on-chain feeds older than ${daysToKeep} days`);
    } catch (error) {
      Logger.error('Failed to cleanup old on-chain feeds', { error });
      throw error;
    }
  }
}