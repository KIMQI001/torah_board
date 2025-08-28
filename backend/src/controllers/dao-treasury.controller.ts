import { Request, Response } from 'express';
import { ResponseUtil } from '@/utils/response';
import { Logger } from '@/utils/logger';
import { prisma } from '@/services/database';
import { AuthenticatedRequest } from '@/types';

export class DAOTreasuryController {
  /**
   * Get treasury transactions for a DAO
   */
  static async getTreasuryTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { daoId } = req.params;
      const { type, status, token, page = '1', limit = '50' } = req.query;
      
      const where: any = { daoId };
      if (type) where.type = type;
      if (status) where.status = status;
      if (token) where.token = token;
      
      const transactions = await prisma.dAOTreasury.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string)
      });
      
      ResponseUtil.success(res, transactions);
    } catch (error) {
      Logger.error('Error fetching treasury transactions', { error });
      ResponseUtil.error(res, 'Failed to fetch treasury transactions');
    }
  }
  
  /**
   * Get treasury balance for a DAO
   */
  static async getTreasuryBalance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { daoId } = req.params;
      
      const transactions = await prisma.dAOTreasury.findMany({
        where: { 
          daoId,
          status: 'CONFIRMED'
        },
        select: {
          type: true,
          amount: true,
          token: true
        }
      });
      
      // Calculate balance by token
      const balanceByToken: Record<string, number> = {};
      
      transactions.forEach(tx => {
        if (!balanceByToken[tx.token]) {
          balanceByToken[tx.token] = 0;
        }
        
        if (tx.type === 'DEPOSIT') {
          balanceByToken[tx.token] += tx.amount;
        } else if (['WITHDRAWAL', 'INVESTMENT', 'REWARD', 'FEE', 'MILESTONE_PAYMENT'].includes(tx.type)) {
          balanceByToken[tx.token] -= tx.amount;
        }
      });
      
      // Format balance data
      const balance = Object.entries(balanceByToken).map(([token, amount]) => ({
        token,
        amount,
        usdValue: 0 // TODO: Implement price feed integration
      }));
      
      ResponseUtil.success(res, { balance, totalValueUSD: 0 });
    } catch (error) {
      Logger.error('Error fetching treasury balance', { error });
      ResponseUtil.error(res, 'Failed to fetch treasury balance');
    }
  }
  
  /**
   * Create deposit transaction (Admin only)
   */
  static async createDeposit(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { daoId } = req.params;
      const { amount, token, txHash, description } = req.body;
      const userId = req.user?.id;
      
      // Check if requester is admin
      const requester = await prisma.dAOMember.findFirst({
        where: {
          daoId,
          userId,
          role: 'ADMIN'
        }
      });
      
      if (!requester) {
        ResponseUtil.forbidden(res, 'Only admins can record deposits');
        return;
      }
      
      const deposit = await prisma.dAOTreasury.create({
        data: {
          daoId,
          type: 'DEPOSIT',
          amount: parseFloat(amount),
          token,
          txHash,
          description,
          initiatedBy: userId,
          status: 'PENDING'
        }
      });
      
      Logger.info('Treasury deposit created', {
        daoId,
        amount,
        token,
        txHash,
        initiatedBy: userId
      });
      
      ResponseUtil.success(res, deposit, 'Deposit transaction created');
    } catch (error) {
      Logger.error('Error creating deposit', { error });
      ResponseUtil.error(res, 'Failed to create deposit transaction');
    }
  }
  
  /**
   * Create withdrawal proposal (Admin only)
   */
  static async createWithdrawal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { daoId } = req.params;
      const { amount, token, recipientAddress, description } = req.body;
      const userId = req.user?.id;
      
      // Check if requester is admin
      const requester = await prisma.dAOMember.findFirst({
        where: {
          daoId,
          userId,
          role: 'ADMIN'
        }
      });
      
      if (!requester) {
        ResponseUtil.forbidden(res, 'Only admins can create withdrawal requests');
        return;
      }
      
      // Check if sufficient balance exists
      const transactions = await prisma.dAOTreasury.findMany({
        where: {
          daoId,
          token,
          status: 'CONFIRMED'
        }
      });
      
      let balance = 0;
      transactions.forEach(tx => {
        if (tx.type === 'DEPOSIT') {
          balance += tx.amount;
        } else if (['WITHDRAWAL', 'INVESTMENT', 'REWARD', 'FEE', 'MILESTONE_PAYMENT'].includes(tx.type)) {
          balance -= tx.amount;
        }
      });
      
      if (balance < parseFloat(amount)) {
        ResponseUtil.error(res, `Insufficient ${token} balance. Available: ${balance}`);
        return;
      }
      
      const withdrawal = await prisma.dAOTreasury.create({
        data: {
          daoId,
          type: 'WITHDRAWAL',
          amount: parseFloat(amount),
          token,
          recipientAddress,
          description,
          initiatedBy: userId,
          status: 'PENDING'
        }
      });
      
      Logger.info('Treasury withdrawal created', {
        daoId,
        amount,
        token,
        recipientAddress,
        initiatedBy: userId
      });
      
      ResponseUtil.success(res, withdrawal, 'Withdrawal request created');
    } catch (error) {
      Logger.error('Error creating withdrawal', { error });
      ResponseUtil.error(res, 'Failed to create withdrawal request');
    }
  }
  
  /**
   * Approve treasury transaction (Admin only)
   */
  static async approveTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;
      const { txHash } = req.body;
      const userId = req.user?.id;
      
      const transaction = await prisma.dAOTreasury.findUnique({
        where: { id: transactionId }
      });
      
      if (!transaction) {
        ResponseUtil.notFound(res, 'Transaction not found');
        return;
      }
      
      // Check if requester is admin
      const requester = await prisma.dAOMember.findFirst({
        where: {
          daoId: transaction.daoId,
          userId,
          role: 'ADMIN'
        }
      });
      
      if (!requester) {
        ResponseUtil.forbidden(res, 'Only admins can approve transactions');
        return;
      }
      
      const updatedTransaction = await prisma.dAOTreasury.update({
        where: { id: transactionId },
        data: {
          status: 'CONFIRMED',
          txHash: txHash || transaction.txHash,
          processedAt: new Date(),
          processedBy: userId
        }
      });
      
      Logger.info('Treasury transaction approved', {
        transactionId,
        type: transaction.type,
        amount: transaction.amount,
        approvedBy: userId
      });
      
      ResponseUtil.success(res, updatedTransaction, 'Transaction approved successfully');
    } catch (error) {
      Logger.error('Error approving transaction', { error });
      ResponseUtil.error(res, 'Failed to approve transaction');
    }
  }
  
  /**
   * Reject treasury transaction (Admin only)
   */
  static async rejectTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;
      
      const transaction = await prisma.dAOTreasury.findUnique({
        where: { id: transactionId }
      });
      
      if (!transaction) {
        ResponseUtil.notFound(res, 'Transaction not found');
        return;
      }
      
      // Check if requester is admin
      const requester = await prisma.dAOMember.findFirst({
        where: {
          daoId: transaction.daoId,
          userId,
          role: 'ADMIN'
        }
      });
      
      if (!requester) {
        ResponseUtil.forbidden(res, 'Only admins can reject transactions');
        return;
      }
      
      const updatedTransaction = await prisma.dAOTreasury.update({
        where: { id: transactionId },
        data: {
          status: 'FAILED',
          description: transaction.description + (reason ? ` | Rejection reason: ${reason}` : ''),
          processedAt: new Date(),
          processedBy: userId
        }
      });
      
      Logger.info('Treasury transaction rejected', {
        transactionId,
        type: transaction.type,
        amount: transaction.amount,
        reason,
        rejectedBy: userId
      });
      
      ResponseUtil.success(res, updatedTransaction, 'Transaction rejected');
    } catch (error) {
      Logger.error('Error rejecting transaction', { error });
      ResponseUtil.error(res, 'Failed to reject transaction');
    }
  }
  
  /**
   * Create investment transaction (Admin only)
   */
  static async createInvestment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { daoId } = req.params;
      const { amount, token, projectId, description } = req.body;
      const userId = req.user?.id;
      
      // Check if requester is admin
      const requester = await prisma.dAOMember.findFirst({
        where: {
          daoId,
          userId,
          role: 'ADMIN'
        }
      });
      
      if (!requester) {
        ResponseUtil.forbidden(res, 'Only admins can create investments');
        return;
      }
      
      // Check if project exists and belongs to DAO
      if (projectId) {
        const project = await prisma.dAOProject.findFirst({
          where: { id: projectId, daoId }
        });
        
        if (!project) {
          ResponseUtil.error(res, 'Project not found or does not belong to this DAO');
          return;
        }
      }
      
      const investment = await prisma.dAOTreasury.create({
        data: {
          daoId,
          type: 'INVESTMENT',
          amount: parseFloat(amount),
          token,
          description,
          initiatedBy: userId,
          status: 'PENDING',
          ...(projectId && { relatedProjectId: projectId })
        }
      });
      
      Logger.info('Treasury investment created', {
        daoId,
        amount,
        token,
        projectId,
        initiatedBy: userId
      });
      
      ResponseUtil.success(res, investment, 'Investment transaction created');
    } catch (error) {
      Logger.error('Error creating investment', { error });
      ResponseUtil.error(res, 'Failed to create investment transaction');
    }
  }
  
  /**
   * Get treasury analytics
   */
  static async getTreasuryAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { daoId } = req.params;
      const { period = '30' } = req.query; // days
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period as string));
      
      const transactions = await prisma.dAOTreasury.findMany({
        where: {
          daoId,
          status: 'CONFIRMED',
          timestamp: { gte: startDate }
        },
        orderBy: { timestamp: 'asc' }
      });
      
      // Calculate analytics
      let totalDeposits = 0;
      let totalWithdrawals = 0;
      let totalInvestments = 0;
      let totalRewards = 0;
      
      const dailyFlow: Record<string, { deposits: number; withdrawals: number; investments: number }> = {};
      const tokenFlow: Record<string, { deposits: number; withdrawals: number }> = {};
      
      transactions.forEach(tx => {
        const dateKey = tx.timestamp.toISOString().split('T')[0];
        const token = tx.token;
        
        // Initialize daily flow
        if (!dailyFlow[dateKey]) {
          dailyFlow[dateKey] = { deposits: 0, withdrawals: 0, investments: 0 };
        }
        
        // Initialize token flow
        if (!tokenFlow[token]) {
          tokenFlow[token] = { deposits: 0, withdrawals: 0 };
        }
        
        switch (tx.type) {
          case 'DEPOSIT':
            totalDeposits += tx.amount;
            dailyFlow[dateKey].deposits += tx.amount;
            tokenFlow[token].deposits += tx.amount;
            break;
          case 'WITHDRAWAL':
            totalWithdrawals += tx.amount;
            dailyFlow[dateKey].withdrawals += tx.amount;
            tokenFlow[token].withdrawals += tx.amount;
            break;
          case 'INVESTMENT':
            totalInvestments += tx.amount;
            dailyFlow[dateKey].investments += tx.amount;
            break;
          case 'REWARD':
            totalRewards += tx.amount;
            break;
        }
      });
      
      const analytics = {
        summary: {
          totalDeposits,
          totalWithdrawals,
          totalInvestments,
          totalRewards,
          netFlow: totalDeposits - totalWithdrawals - totalInvestments
        },
        dailyFlow: Object.entries(dailyFlow).map(([date, flow]) => ({
          date,
          ...flow
        })),
        tokenFlow: Object.entries(tokenFlow).map(([token, flow]) => ({
          token,
          ...flow,
          netFlow: flow.deposits - flow.withdrawals
        })),
        transactionCount: transactions.length
      };
      
      ResponseUtil.success(res, analytics);
    } catch (error) {
      Logger.error('Error fetching treasury analytics', { error });
      ResponseUtil.error(res, 'Failed to fetch treasury analytics');
    }
  }
}