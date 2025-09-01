import { Request, Response } from 'express';
import { ResponseUtil } from '@/utils/response';
import { Logger } from '@/utils/logger';
import { AuthenticatedRequest } from '@/types';
import { VotingWeightService } from '@/services/voting-weight.service';
import { ProposalExecutionService } from '@/services/proposal-execution.service';
import { prisma } from '@/services/database';

export class VotingWeightController {
  /**
   * 获取成员的投票权重
   */
  static async getMemberVotingPower(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { daoId, memberId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        ResponseUtil.unauthorized(res);
        return;
      }

      // 验证用户是否为DAO成员
      const requestingMember = await prisma.dAOMember.findFirst({
        where: { daoId, userId }
      });

      if (!requestingMember) {
        ResponseUtil.forbidden(res, 'You must be a DAO member to view voting power');
        return;
      }

      // 获取目标成员信息
      const targetMember = await prisma.dAOMember.findUnique({
        where: { id: memberId }
      });

      if (!targetMember || targetMember.daoId !== daoId) {
        ResponseUtil.notFound(res, 'Member not found in this DAO');
        return;
      }

      const votingPower = await VotingWeightService.calculateVotingPower(memberId);
      
      ResponseUtil.success(res, { 
        memberId,
        votingPower,
        lastUpdated: new Date()
      });
    } catch (error) {
      Logger.error('Error getting member voting power', { error });
      ResponseUtil.error(res, 'Failed to get voting power');
    }
  }

  /**
   * 更新DAO所有成员的投票权重（仅管理员）
   */
  static async updateDAOVotingPowers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { daoId } = req.params;
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
        ResponseUtil.forbidden(res, 'Only DAO admins can update voting powers');
        return;
      }

      await VotingWeightService.updateDAOVotingPowers(daoId);
      ResponseUtil.success(res, null, 'All DAO member voting powers updated successfully');
    } catch (error) {
      Logger.error('Error updating DAO voting powers', { error });
      ResponseUtil.error(res, 'Failed to update voting powers');
    }
  }

  /**
   * 获取提案的投票阈值检查结果
   */
  static async checkProposalThreshold(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { proposalId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        ResponseUtil.unauthorized(res);
        return;
      }

      // 获取提案信息
      const proposal = await prisma.dAOProposal.findUnique({
        where: { id: proposalId }
      });

      if (!proposal) {
        ResponseUtil.notFound(res, 'Proposal not found');
        return;
      }

      // 验证用户是否为DAO成员
      const member = await prisma.dAOMember.findFirst({
        where: { daoId: proposal.daoId, userId }
      });

      if (!member) {
        ResponseUtil.forbidden(res, 'You must be a DAO member to check proposal threshold');
        return;
      }

      const thresholdResult = await VotingWeightService.checkProposalThreshold(proposalId);
      ResponseUtil.success(res, thresholdResult);
    } catch (error) {
      Logger.error('Error checking proposal threshold', { error });
      ResponseUtil.error(res, 'Failed to check proposal threshold');
    }
  }

  /**
   * 获取DAO的法定人数阈值
   */
  static async getQuorumThreshold(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { daoId } = req.params;
      const { quorumPercentage = '50' } = req.query;
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
        ResponseUtil.forbidden(res, 'You must be a DAO member to view quorum threshold');
        return;
      }

      const threshold = await VotingWeightService.calculateQuorumThreshold(
        daoId,
        parseInt(quorumPercentage as string)
      );

      ResponseUtil.success(res, {
        daoId,
        quorumPercentage: parseInt(quorumPercentage as string),
        requiredVotingPower: threshold
      });
    } catch (error) {
      Logger.error('Error getting quorum threshold', { error });
      ResponseUtil.error(res, 'Failed to get quorum threshold');
    }
  }

  /**
   * 获取执行队列状态（仅管理员）
   */
  static async getExecutionQueueStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { daoId } = req.params;
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
        ResponseUtil.forbidden(res, 'Only DAO admins can view execution queue status');
        return;
      }

      const queueStatus = ProposalExecutionService.getQueueStatus();
      
      // 过滤只显示该DAO的任务
      const daoTasks = queueStatus.filter(async (task) => {
        const proposal = await prisma.dAOProposal.findUnique({
          where: { id: task.proposalId }
        });
        return proposal?.daoId === daoId;
      });

      ResponseUtil.success(res, daoTasks);
    } catch (error) {
      Logger.error('Error getting execution queue status', { error });
      ResponseUtil.error(res, 'Failed to get execution queue status');
    }
  }

  /**
   * 取消提案执行（仅管理员）
   */
  static async cancelProposalExecution(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { proposalId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        ResponseUtil.unauthorized(res);
        return;
      }

      // 获取提案信息
      const proposal = await prisma.dAOProposal.findUnique({
        where: { id: proposalId }
      });

      if (!proposal) {
        ResponseUtil.notFound(res, 'Proposal not found');
        return;
      }

      // 验证用户是否为DAO管理员
      const member = await prisma.dAOMember.findFirst({
        where: { 
          daoId: proposal.daoId, 
          userId, 
          role: 'ADMIN' 
        }
      });

      if (!member) {
        ResponseUtil.forbidden(res, 'Only DAO admins can cancel proposal execution');
        return;
      }

      await ProposalExecutionService.cancelExecution(proposalId);
      ResponseUtil.success(res, null, 'Proposal execution cancelled successfully');
    } catch (error) {
      Logger.error('Error cancelling proposal execution', { error });
      ResponseUtil.error(res, 'Failed to cancel proposal execution');
    }
  }

  /**
   * 获取DAO成员投票权重排行榜
   */
  static async getVotingPowerRanking(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { daoId } = req.params;
      const { limit = '10' } = req.query;
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
        ResponseUtil.forbidden(res, 'You must be a DAO member to view voting power ranking');
        return;
      }

      const members = await prisma.dAOMember.findMany({
        where: { 
          daoId,
          status: 'ACTIVE'
        },
        include: {
          user: {
            select: {
              walletAddress: true
            }
          }
        },
        orderBy: {
          votingPower: 'desc'
        },
        take: parseInt(limit as string)
      });

      const ranking = members.map((member, index) => ({
        rank: index + 1,
        address: member.address,
        walletAddress: member.user.walletAddress,
        votingPower: member.votingPower,
        role: member.role,
        contributionScore: member.contributionScore,
        reputation: member.reputation
      }));

      ResponseUtil.success(res, ranking);
    } catch (error) {
      Logger.error('Error getting voting power ranking', { error });
      ResponseUtil.error(res, 'Failed to get voting power ranking');
    }
  }
}