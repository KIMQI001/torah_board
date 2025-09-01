import { prisma } from '@/services/database';
import { Logger } from '@/utils/logger';
import { TreasuryService } from './treasury.service';
import { VotingWeightService } from './voting-weight.service';

export interface FundingRequest {
  id: string;
  daoId: string;
  proposalId: string;
  requestType: 'PROJECT_FUNDING' | 'MILESTONE_PAYMENT' | 'EMERGENCY_FUND' | 'OPERATIONAL_EXPENSES';
  amount: number;
  token: string;
  recipient: string;
  purpose: string;
  justification: string;
  requiredDocuments: string[];
  attachments?: string[];
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
  reviewers: string[];
  approvalThreshold: number;
  currentApprovals: number;
  createdAt: Date;
  reviewDeadline: Date;
}

export interface FundingReview {
  reviewerId: string;
  requestId: string;
  decision: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES';
  comments: string;
  attachments?: string[];
  votingPower: number;
  timestamp: Date;
}

export class FundingRequestService {
  /**
   * 创建资金申请
   */
  static async createFundingRequest(
    daoId: string,
    proposalId: string,
    requestData: {
      requestType: FundingRequest['requestType'];
      amount: number;
      token: string;
      recipient: string;
      purpose: string;
      justification: string;
      requiredDocuments: string[];
      attachments?: string[];
      reviewDeadline?: Date;
    },
    createdBy: string
  ): Promise<string> {
    try {
      // 获取DAO信息以设置审批阈值
      const dao = await prisma.dAO.findUnique({
        where: { id: daoId }
      });

      if (!dao) {
        throw new Error('DAO not found');
      }

      // 根据申请金额设定审批阈值
      let approvalThreshold = 60; // 默认60%
      if (requestData.amount > 10000) {
        approvalThreshold = 75; // 大额申请需要75%
      } else if (requestData.amount > 50000) {
        approvalThreshold = 90; // 特大额申请需要90%
      }

      // 获取有投票权的成员作为审查者
      const reviewers = await prisma.dAOMember.findMany({
        where: {
          daoId,
          status: 'ACTIVE',
          votingPower: { gt: 0 }
        },
        select: { id: true }
      });

      const reviewerIds = reviewers.map(r => r.id);

      // 创建资金申请记录
      const request = await prisma.dAOFundingRequest.create({
        data: {
          daoId,
          proposalId,
          requestType: requestData.requestType,
          amount: requestData.amount,
          token: requestData.token,
          recipient: requestData.recipient,
          purpose: requestData.purpose,
          justification: requestData.justification,
          requiredDocuments: JSON.stringify(requestData.requiredDocuments),
          attachments: requestData.attachments ? JSON.stringify(requestData.attachments) : null,
          status: 'SUBMITTED',
          reviewers: JSON.stringify(reviewerIds),
          approvalThreshold,
          reviewDeadline: requestData.reviewDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 默认7天
          createdBy
        }
      });

      Logger.info('Funding request created', {
        requestId: request.id,
        daoId,
        amount: requestData.amount,
        requestType: requestData.requestType
      });

      return request.id;
    } catch (error) {
      Logger.error('Failed to create funding request', { error });
      throw error;
    }
  }

  /**
   * 提交审查意见
   */
  static async submitReview(
    requestId: string,
    reviewerId: string,
    review: {
      decision: FundingReview['decision'];
      comments: string;
      attachments?: string[];
    }
  ): Promise<void> {
    try {
      // 检查申请是否存在且可以审查
      const request = await prisma.dAOFundingRequest.findUnique({
        where: { id: requestId }
      });

      if (!request) {
        throw new Error('Funding request not found');
      }

      if (!['SUBMITTED', 'UNDER_REVIEW'].includes(request.status)) {
        throw new Error('Funding request is not available for review');
      }

      // 检查审查者是否有权审查
      const reviewers = JSON.parse(request.reviewers);
      if (!reviewers.includes(reviewerId)) {
        throw new Error('You are not authorized to review this request');
      }

      // 检查是否已经审查过
      const existingReview = await prisma.dAOFundingReview.findUnique({
        where: {
          requestId_reviewerId: {
            requestId,
            reviewerId
          }
        }
      });

      if (existingReview) {
        throw new Error('You have already reviewed this request');
      }

      // 获取审查者的投票权
      const reviewer = await prisma.dAOMember.findUnique({
        where: { id: reviewerId }
      });

      if (!reviewer) {
        throw new Error('Reviewer not found');
      }

      // 创建审查记录
      await prisma.dAOFundingReview.create({
        data: {
          requestId,
          reviewerId,
          decision: review.decision,
          comments: review.comments,
          attachments: review.attachments ? JSON.stringify(review.attachments) : null,
          votingPower: reviewer.votingPower
        }
      });

      // 更新申请状态
      await prisma.dAOFundingRequest.update({
        where: { id: requestId },
        data: { status: 'UNDER_REVIEW' }
      });

      // 检查是否达到审批条件
      await this.checkApprovalStatus(requestId);

      Logger.info('Funding review submitted', {
        requestId,
        reviewerId,
        decision: review.decision
      });
    } catch (error) {
      Logger.error('Failed to submit funding review', { error });
      throw error;
    }
  }

  /**
   * 检查审批状态
   */
  private static async checkApprovalStatus(requestId: string): Promise<void> {
    try {
      const request = await prisma.dAOFundingRequest.findUnique({
        where: { id: requestId },
        include: {
          reviews: true
        }
      });

      if (!request) return;

      // 计算审批情况
      const totalVotingPower = await this.getTotalReviewerVotingPower(requestId);
      const approvalPower = request.reviews
        .filter(r => r.decision === 'APPROVE')
        .reduce((sum, r) => sum + r.votingPower, 0);
      const rejectionPower = request.reviews
        .filter(r => r.decision === 'REJECT')
        .reduce((sum, r) => sum + r.votingPower, 0);

      const approvalPercentage = totalVotingPower > 0 ? (approvalPower / totalVotingPower) * 100 : 0;
      const rejectionPercentage = totalVotingPower > 0 ? (rejectionPower / totalVotingPower) * 100 : 0;

      // 更新当前审批数
      await prisma.dAOFundingRequest.update({
        where: { id: requestId },
        data: { currentApprovals: approvalPercentage }
      });

      // 检查是否达到审批或拒绝条件
      if (approvalPercentage >= request.approvalThreshold) {
        await this.approveFundingRequest(requestId);
      } else if (rejectionPercentage >= 50) { // 拒绝只需50%
        await this.rejectFundingRequest(requestId, 'Rejected by reviewers');
      }
    } catch (error) {
      Logger.error('Failed to check approval status', { error });
    }
  }

  /**
   * 批准资金申请
   */
  private static async approveFundingRequest(requestId: string): Promise<void> {
    try {
      const request = await prisma.dAOFundingRequest.findUnique({
        where: { id: requestId }
      });

      if (!request) return;

      // 检查财务余额
      const fundsAvailable = await TreasuryService.checkFundsAvailability(
        request.daoId,
        request.amount,
        request.token
      );

      if (!fundsAvailable) {
        await this.rejectFundingRequest(requestId, 'Insufficient treasury funds');
        return;
      }

      // 更新状态为已批准
      await prisma.dAOFundingRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' }
      });

      // 创建转账请求
      await TreasuryService.createTransferRequest(
        request.daoId,
        this.getTransferType(request.requestType),
        request.amount,
        request.token,
        request.recipient,
        `Approved funding request: ${request.purpose}`,
        request.proposalId
      );

      Logger.info('Funding request approved', { requestId });
    } catch (error) {
      Logger.error('Failed to approve funding request', { error });
    }
  }

  /**
   * 拒绝资金申请
   */
  private static async rejectFundingRequest(requestId: string, reason: string): Promise<void> {
    try {
      await prisma.dAOFundingRequest.update({
        where: { id: requestId },
        data: { 
          status: 'REJECTED',
          rejectionReason: reason
        }
      });

      Logger.info('Funding request rejected', { requestId, reason });
    } catch (error) {
      Logger.error('Failed to reject funding request', { error });
    }
  }

  /**
   * 获取审查者的总投票权
   */
  private static async getTotalReviewerVotingPower(requestId: string): Promise<number> {
    const request = await prisma.dAOFundingRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) return 0;

    const reviewerIds = JSON.parse(request.reviewers);
    const members = await prisma.dAOMember.findMany({
      where: { id: { in: reviewerIds } }
    });

    return members.reduce((sum, member) => sum + member.votingPower, 0);
  }

  /**
   * 转换申请类型到转账类型
   */
  private static getTransferType(requestType: FundingRequest['requestType']): 'WITHDRAWAL' | 'INVESTMENT' | 'MILESTONE_PAYMENT' {
    switch (requestType) {
      case 'PROJECT_FUNDING':
        return 'INVESTMENT';
      case 'MILESTONE_PAYMENT':
        return 'MILESTONE_PAYMENT';
      case 'EMERGENCY_FUND':
      case 'OPERATIONAL_EXPENSES':
        return 'WITHDRAWAL';
      default:
        return 'WITHDRAWAL';
    }
  }

  /**
   * 获取资金申请列表
   */
  static async getFundingRequests(
    daoId: string,
    status?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<FundingRequest[]> {
    try {
      const where: any = { daoId };
      if (status) where.status = status;

      const requests = await prisma.dAOFundingRequest.findMany({
        where,
        include: {
          reviews: {
            include: {
              reviewer: {
                select: {
                  address: true,
                  role: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      return requests;
    } catch (error) {
      Logger.error('Failed to get funding requests', { error });
      throw error;
    }
  }

  /**
   * 获取单个资金申请详情
   */
  static async getFundingRequest(requestId: string): Promise<FundingRequest | null> {
    try {
      const request = await prisma.dAOFundingRequest.findUnique({
        where: { id: requestId },
        include: {
          reviews: {
            include: {
              reviewer: {
                select: {
                  address: true,
                  role: true,
                  user: {
                    select: {
                      walletAddress: true
                    }
                  }
                }
              }
            }
          },
          proposal: {
            select: {
              title: true,
              description: true
            }
          }
        }
      });

      return request;
    } catch (error) {
      Logger.error('Failed to get funding request', { error });
      throw error;
    }
  }

  /**
   * 执行已批准的资金申请
   */
  static async executeFundingRequest(
    requestId: string,
    executorId: string
  ): Promise<void> {
    try {
      const request = await prisma.dAOFundingRequest.findUnique({
        where: { id: requestId }
      });

      if (!request) {
        throw new Error('Funding request not found');
      }

      if (request.status !== 'APPROVED') {
        throw new Error('Only approved requests can be executed');
      }

      // 验证执行者权限
      const executor = await prisma.dAOMember.findFirst({
        where: {
          id: executorId,
          daoId: request.daoId,
          role: 'ADMIN'
        }
      });

      if (!executor) {
        throw new Error('Only DAO admins can execute funding requests');
      }

      // 执行转账
      const transactionId = await TreasuryService.createTransferRequest(
        request.daoId,
        this.getTransferType(request.requestType),
        request.amount,
        request.token,
        request.recipient,
        `Execution of approved funding request: ${request.purpose}`,
        request.proposalId
      );

      // 更新状态
      await prisma.dAOFundingRequest.update({
        where: { id: requestId },
        data: { 
          status: 'EXECUTED',
          executedAt: new Date(),
          executorId,
          transactionId
        }
      });

      Logger.info('Funding request executed', {
        requestId,
        executorId,
        transactionId
      });
    } catch (error) {
      Logger.error('Failed to execute funding request', { error });
      throw error;
    }
  }
}