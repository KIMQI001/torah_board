import { Request, Response } from 'express';
import { ResponseUtil } from '@/utils/response';
import { Logger } from '@/utils/logger';
import { AuthenticatedRequest } from '@/types';
import { TreasuryService } from '@/services/treasury.service';
import { prisma } from '@/services/database';

export class TreasuryController {
  /**
   * 获取DAO财务余额
   */
  static async getDAOBalance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { daoId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        ResponseUtil.unauthorized(res);
        return;
      }

      // 验证用户是否为DAO成员
      const member = await prisma.dAOMember.findFirst({
        where: { daoId, userId }
      });

      if (!member) {
        ResponseUtil.forbidden(res, 'You must be a DAO member to view treasury');
        return;
      }

      const balances = await TreasuryService.getDAOBalance(daoId);
      ResponseUtil.success(res, balances);
    } catch (error) {
      Logger.error('Error getting DAO balance', { error });
      ResponseUtil.error(res, 'Failed to get DAO balance');
    }
  }

  /**
   * 获取DAO财务指标
   */
  static async getTreasuryMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { daoId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        ResponseUtil.unauthorized(res);
        return;
      }

      // 验证用户是否为DAO成员
      const member = await prisma.dAOMember.findFirst({
        where: { daoId, userId }
      });

      if (!member) {
        ResponseUtil.forbidden(res, 'You must be a DAO member to view treasury metrics');
        return;
      }

      const metrics = await TreasuryService.getTreasuryMetrics(daoId);
      ResponseUtil.success(res, metrics);
    } catch (error) {
      Logger.error('Error getting treasury metrics', { error });
      ResponseUtil.error(res, 'Failed to get treasury metrics');
    }
  }

  /**
   * 获取交易历史
   */
  static async getTransactionHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { daoId } = req.params;
      const { page = '1', limit = '20' } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        ResponseUtil.unauthorized(res);
        return;
      }

      // 验证用户是否为DAO成员
      const member = await prisma.dAOMember.findFirst({
        where: { daoId, userId }
      });

      if (!member) {
        ResponseUtil.forbidden(res, 'You must be a DAO member to view transaction history');
        return;
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const transactions = await TreasuryService.getTransactionHistory(daoId, limitNum, offset);
      ResponseUtil.success(res, transactions);
    } catch (error) {
      Logger.error('Error getting transaction history', { error });
      ResponseUtil.error(res, 'Failed to get transaction history');
    }
  }

  /**
   * 创建资金转账请求（仅管理员）
   */
  static async createTransferRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { daoId } = req.params;
      const { type, amount, token, to, description, proposalId, projectId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        ResponseUtil.unauthorized(res);
        return;
      }

      // 验证用户是否为DAO管理员
      const member = await prisma.dAOMember.findFirst({
        where: { daoId, userId, role: 'ADMIN' }
      });

      if (!member) {
        ResponseUtil.forbidden(res, 'Only DAO admins can create transfer requests');
        return;
      }

      const transactionId = await TreasuryService.createTransferRequest(
        daoId,
        type,
        amount,
        token || 'USDC',
        to,
        description,
        proposalId,
        projectId
      );

      ResponseUtil.success(res, { transactionId }, 'Transfer request created successfully');
    } catch (error) {
      Logger.error('Error creating transfer request', { error });
      ResponseUtil.error(res, error.message || 'Failed to create transfer request');
    }
  }

  /**
   * 确认交易（仅管理员）
   */
  static async confirmTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;
      const { txHash } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        ResponseUtil.unauthorized(res);
        return;
      }

      // 获取交易信息
      const transaction = await prisma.dAOTreasury.findUnique({
        where: { id: transactionId }
      });

      if (!transaction) {
        ResponseUtil.notFound(res, 'Transaction not found');
        return;
      }

      // 验证用户是否为DAO管理员
      const member = await prisma.dAOMember.findFirst({
        where: { 
          daoId: transaction.daoId, 
          userId, 
          role: 'ADMIN' 
        }
      });

      if (!member) {
        ResponseUtil.forbidden(res, 'Only DAO admins can confirm transactions');
        return;
      }

      await TreasuryService.confirmTransaction(transactionId, txHash);
      ResponseUtil.success(res, null, 'Transaction confirmed successfully');
    } catch (error) {
      Logger.error('Error confirming transaction', { error });
      ResponseUtil.error(res, 'Failed to confirm transaction');
    }
  }

  /**
   * 处理里程碑付款（仅管理员）
   */
  static async processMilestonePayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { daoId, projectId, milestoneId } = req.params;
      const { amount, recipientAddress } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        ResponseUtil.unauthorized(res);
        return;
      }

      // 验证用户是否为DAO管理员
      const member = await prisma.dAOMember.findFirst({
        where: { daoId, userId, role: 'ADMIN' }
      });

      if (!member) {
        ResponseUtil.forbidden(res, 'Only DAO admins can process milestone payments');
        return;
      }

      const transactionId = await TreasuryService.processMilestonePayment(
        daoId,
        projectId,
        milestoneId,
        amount,
        recipientAddress
      );

      ResponseUtil.success(res, { transactionId }, 'Milestone payment processed successfully');
    } catch (error) {
      Logger.error('Error processing milestone payment', { error });
      ResponseUtil.error(res, error.message || 'Failed to process milestone payment');
    }
  }

  /**
   * 分配项目资金（仅管理员）
   */
  static async allocateProjectFunding(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { daoId, projectId } = req.params;
      const { amount } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        ResponseUtil.unauthorized(res);
        return;
      }

      // 验证用户是否为DAO管理员
      const member = await prisma.dAOMember.findFirst({
        where: { daoId, userId, role: 'ADMIN' }
      });

      if (!member) {
        ResponseUtil.forbidden(res, 'Only DAO admins can allocate project funding');
        return;
      }

      await TreasuryService.allocateProjectFunding(daoId, projectId, amount);
      ResponseUtil.success(res, null, 'Project funding allocated successfully');
    } catch (error) {
      Logger.error('Error allocating project funding', { error });
      ResponseUtil.error(res, error.message || 'Failed to allocate project funding');
    }
  }
}