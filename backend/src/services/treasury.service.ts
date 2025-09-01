import { prisma } from '@/services/database';
import { Logger } from '@/utils/logger';

export interface TreasuryTransaction {
  id: string;
  daoId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'INVESTMENT' | 'REWARD' | 'FEE' | 'MILESTONE_PAYMENT';
  amount: number;
  token: string;
  from?: string;
  to?: string;
  description: string;
  proposalId?: string;
  projectId?: string;
  txHash?: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
}

export interface TreasuryBalance {
  token: string;
  balance: number;
  usdValue: number;
}

export interface TreasuryMetrics {
  totalValue: number;
  totalIncome: number;
  totalExpenses: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  topTokens: TreasuryBalance[];
}

export class TreasuryService {
  /**
   * 获取DAO财务余额
   */
  static async getDAOBalance(daoId: string): Promise<TreasuryBalance[]> {
    try {
      // 计算每种代币的净余额
      const transactions = await prisma.dAOTreasury.findMany({
        where: { 
          daoId,
          status: 'CONFIRMED'
        },
        orderBy: { timestamp: 'desc' }
      });

      const balanceMap = new Map<string, number>();

      transactions.forEach(tx => {
        const currentBalance = balanceMap.get(tx.token) || 0;
        
        if (tx.type === 'DEPOSIT' || tx.type === 'REWARD') {
          balanceMap.set(tx.token, currentBalance + tx.amount);
        } else if (['WITHDRAWAL', 'INVESTMENT', 'FEE', 'MILESTONE_PAYMENT'].includes(tx.type)) {
          balanceMap.set(tx.token, currentBalance - tx.amount);
        }
      });

      // 转换为余额数组（简化处理，实际应该从price API获取）
      const balances: TreasuryBalance[] = [];
      for (const [token, balance] of balanceMap) {
        if (balance > 0) {
          balances.push({
            token,
            balance,
            usdValue: balance * this.getTokenPrice(token) // 简化价格计算
          });
        }
      }

      return balances.sort((a, b) => b.usdValue - a.usdValue);
    } catch (error) {
      Logger.error('Failed to get DAO balance', { error, daoId });
      throw error;
    }
  }

  /**
   * 获取DAO财务指标
   */
  static async getTreasuryMetrics(daoId: string): Promise<TreasuryMetrics> {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // 获取所有确认的交易
      const allTransactions = await prisma.dAOTreasury.findMany({
        where: { 
          daoId,
          status: 'CONFIRMED'
        }
      });

      // 本月交易
      const monthlyTransactions = allTransactions.filter(
        tx => new Date(tx.timestamp) >= monthStart
      );

      let totalIncome = 0;
      let totalExpenses = 0;
      let monthlyIncome = 0;
      let monthlyExpenses = 0;

      // 计算收入和支出（简化为USDC计算）
      allTransactions.forEach(tx => {
        const usdAmount = tx.amount * this.getTokenPrice(tx.token);
        
        if (tx.type === 'DEPOSIT' || tx.type === 'REWARD') {
          totalIncome += usdAmount;
        } else if (['WITHDRAWAL', 'INVESTMENT', 'FEE', 'MILESTONE_PAYMENT'].includes(tx.type)) {
          totalExpenses += usdAmount;
        }
      });

      monthlyTransactions.forEach(tx => {
        const usdAmount = tx.amount * this.getTokenPrice(tx.token);
        
        if (tx.type === 'DEPOSIT' || tx.type === 'REWARD') {
          monthlyIncome += usdAmount;
        } else if (['WITHDRAWAL', 'INVESTMENT', 'FEE', 'MILESTONE_PAYMENT'].includes(tx.type)) {
          monthlyExpenses += usdAmount;
        }
      });

      const balances = await this.getDAOBalance(daoId);
      const totalValue = balances.reduce((sum, b) => sum + b.usdValue, 0);
      const topTokens = balances.slice(0, 5);

      return {
        totalValue,
        totalIncome,
        totalExpenses,
        monthlyIncome,
        monthlyExpenses,
        topTokens
      };
    } catch (error) {
      Logger.error('Failed to get treasury metrics', { error, daoId });
      throw error;
    }
  }

  /**
   * 创建资金转账请求
   */
  static async createTransferRequest(
    daoId: string,
    type: TreasuryTransaction['type'],
    amount: number,
    token: string,
    to?: string,
    description?: string,
    proposalId?: string,
    projectId?: string
  ): Promise<string> {
    try {
      // 检查余额是否充足（支出类型）
      if (['WITHDRAWAL', 'INVESTMENT', 'MILESTONE_PAYMENT'].includes(type)) {
        const balances = await this.getDAOBalance(daoId);
        const tokenBalance = balances.find(b => b.token === token);
        
        if (!tokenBalance || tokenBalance.balance < amount) {
          throw new Error(`Insufficient ${token} balance`);
        }
      }

      // 创建交易记录
      const transaction = await prisma.dAOTreasury.create({
        data: {
          daoId,
          type,
          amount,
          token,
          to,
          description: description || `${type} transaction`,
          proposalId,
          projectId,
          status: 'PENDING'
        }
      });

      Logger.info('Transfer request created', {
        transactionId: transaction.id,
        daoId,
        type,
        amount,
        token
      });

      return transaction.id;
    } catch (error) {
      Logger.error('Failed to create transfer request', { error });
      throw error;
    }
  }

  /**
   * 确认转账交易
   */
  static async confirmTransaction(
    transactionId: string,
    txHash: string
  ): Promise<void> {
    try {
      await prisma.dAOTreasury.update({
        where: { id: transactionId },
        data: {
          status: 'CONFIRMED',
          txHash
        }
      });

      Logger.info('Transaction confirmed', { transactionId, txHash });
    } catch (error) {
      Logger.error('Failed to confirm transaction', { error, transactionId });
      throw error;
    }
  }

  /**
   * 处理里程碑付款
   */
  static async processMilestonePayment(
    daoId: string,
    projectId: string,
    milestoneId: string,
    amount: number,
    recipientAddress: string
  ): Promise<string> {
    try {
      // 获取项目信息
      const project = await prisma.dAOProject.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // 检查预算是否充足
      if (project.spentFunds + amount > project.allocatedFunds) {
        throw new Error('Milestone payment exceeds allocated budget');
      }

      // 创建付款交易
      const transactionId = await this.createTransferRequest(
        daoId,
        'MILESTONE_PAYMENT',
        amount,
        'USDC', // 默认使用USDC
        recipientAddress,
        `Milestone payment for project: ${project.title}`,
        undefined,
        projectId
      );

      // 更新项目花费
      await prisma.dAOProject.update({
        where: { id: projectId },
        data: {
          spentFunds: project.spentFunds + amount
        }
      });

      // 更新里程碑状态
      await prisma.dAOMilestone.update({
        where: { id: milestoneId },
        data: {
          status: 'PAID'
        }
      });

      Logger.info('Milestone payment processed', {
        transactionId,
        projectId,
        milestoneId,
        amount
      });

      return transactionId;
    } catch (error) {
      Logger.error('Failed to process milestone payment', { error });
      throw error;
    }
  }

  /**
   * 处理项目投资分配
   */
  static async allocateProjectFunding(
    daoId: string,
    projectId: string,
    amount: number
  ): Promise<void> {
    try {
      const project = await prisma.dAOProject.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // 创建投资记录
      await this.createTransferRequest(
        daoId,
        'INVESTMENT',
        amount,
        'USDC',
        undefined,
        `Investment allocation for project: ${project.title}`,
        undefined,
        projectId
      );

      // 更新项目分配资金
      await prisma.dAOProject.update({
        where: { id: projectId },
        data: {
          allocatedFunds: project.allocatedFunds + amount
        }
      });

      Logger.info('Project funding allocated', { projectId, amount });
    } catch (error) {
      Logger.error('Failed to allocate project funding', { error });
      throw error;
    }
  }

  /**
   * 获取代币价格（简化实现）
   */
  private static getTokenPrice(token: string): number {
    // 简化的价格映射，实际应该从外部API获取
    const prices: Record<string, number> = {
      'USDC': 1.0,
      'SOL': 100.0,
      'ETH': 3000.0,
      'BTC': 45000.0
    };
    
    return prices[token] || 1.0;
  }

  /**
   * 获取财务交易历史
   */
  static async getTransactionHistory(
    daoId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<TreasuryTransaction[]> {
    try {
      const transactions = await prisma.dAOTreasury.findMany({
        where: { daoId },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset
      });

      return transactions;
    } catch (error) {
      Logger.error('Failed to get transaction history', { error, daoId });
      throw error;
    }
  }

  /**
   * 检查DAO是否有足够资金执行提案
   */
  static async checkFundsAvailability(
    daoId: string,
    amount: number,
    token: string = 'USDC'
  ): Promise<boolean> {
    try {
      const balances = await this.getDAOBalance(daoId);
      const tokenBalance = balances.find(b => b.token === token);
      
      return tokenBalance ? tokenBalance.balance >= amount : false;
    } catch (error) {
      Logger.error('Failed to check funds availability', { error });
      return false;
    }
  }
}