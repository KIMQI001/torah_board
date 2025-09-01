import { prisma } from '@/services/database';
import { Logger } from '@/utils/logger';
import { TreasuryService } from './treasury.service';
import { VotingWeightService } from './voting-weight.service';

export interface MilestoneVerification {
  id: string;
  milestoneId: string;
  projectId: string;
  daoId: string;
  verificationMethod: 'PEER_REVIEW' | 'AUTOMATED_CHECK' | 'EXTERNAL_AUDIT' | 'DELIVERABLE_SUBMISSION';
  requiredEvidence: string[];
  submittedEvidence: string[];
  verifiers: string[];
  verificationThreshold: number;
  currentApprovals: number;
  status: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'PAYMENT_PROCESSED';
  submittedAt: Date;
  verificationDeadline: Date;
}

export interface VerificationReview {
  id: string;
  verificationId: string;
  reviewerId: string;
  decision: 'APPROVE' | 'REJECT' | 'REQUEST_MORE_EVIDENCE';
  comments: string;
  evidenceChecked: string[];
  votingPower: number;
  timestamp: Date;
}

export class MilestoneVerificationService {
  /**
   * 提交里程碑验证申请
   */
  static async submitMilestoneForVerification(
    milestoneId: string,
    evidenceSubmission: {
      submittedEvidence: string[];
      verificationNotes?: string;
    },
    submittedBy: string
  ): Promise<string> {
    try {
      // 获取里程碑信息
      const milestone = await prisma.dAOMilestone.findUnique({
        where: { id: milestoneId },
        include: {
          project: {
            include: {
              dao: true
            }
          }
        }
      });

      if (!milestone) {
        throw new Error('Milestone not found');
      }

      if (milestone.status !== 'COMPLETED') {
        throw new Error('Only completed milestones can be submitted for verification');
      }

      // 检查提交者权限
      const submitter = await prisma.dAOMember.findFirst({
        where: {
          daoId: milestone.project.daoId,
          userId: submittedBy
        }
      });

      if (!submitter) {
        throw new Error('Only DAO members can submit milestones for verification');
      }

      // 获取验证要求
      const requiredEvidence = milestone.deliverables ? 
        JSON.parse(milestone.deliverables) : ['Project deliverable documentation'];

      // 确定验证方法和验证者
      const verificationMethod = this.determineVerificationMethod(milestone);
      const verifiers = await this.selectVerifiers(milestone.project.daoId, milestone.budget);

      // 创建验证记录
      const verification = await prisma.dAOMilestoneVerification.create({
        data: {
          milestoneId,
          projectId: milestone.projectId,
          daoId: milestone.project.daoId,
          verificationMethod,
          requiredEvidence: JSON.stringify(requiredEvidence),
          submittedEvidence: JSON.stringify(evidenceSubmission.submittedEvidence),
          verifiers: JSON.stringify(verifiers),
          verificationThreshold: milestone.verificationReq,
          verificationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天验证期
          submittedBy,
          verificationNotes: evidenceSubmission.verificationNotes || ''
        }
      });

      // 更新里程碑状态
      await prisma.dAOMilestone.update({
        where: { id: milestoneId },
        data: { status: 'PENDING_VERIFICATION' }
      });

      Logger.info('Milestone verification submitted', {
        verificationId: verification.id,
        milestoneId,
        verificationMethod
      });

      return verification.id;
    } catch (error) {
      Logger.error('Failed to submit milestone for verification', { error });
      throw error;
    }
  }

  /**
   * 提交验证评审
   */
  static async submitVerificationReview(
    verificationId: string,
    reviewerId: string,
    review: {
      decision: VerificationReview['decision'];
      comments: string;
      evidenceChecked: string[];
    }
  ): Promise<void> {
    try {
      // 获取验证信息
      const verification = await prisma.dAOMilestoneVerification.findUnique({
        where: { id: verificationId }
      });

      if (!verification) {
        throw new Error('Verification not found');
      }

      if (!['PENDING', 'UNDER_REVIEW'].includes(verification.status)) {
        throw new Error('Verification is not available for review');
      }

      // 检查评审者权限
      const verifiers = JSON.parse(verification.verifiers);
      if (!verifiers.includes(reviewerId)) {
        throw new Error('You are not authorized to review this verification');
      }

      // 检查是否已经评审过
      const existingReview = await prisma.dAOVerificationReview.findUnique({
        where: {
          verificationId_reviewerId: {
            verificationId,
            reviewerId
          }
        }
      });

      if (existingReview) {
        throw new Error('You have already reviewed this verification');
      }

      // 获取评审者投票权
      const reviewer = await prisma.dAOMember.findUnique({
        where: { id: reviewerId }
      });

      if (!reviewer) {
        throw new Error('Reviewer not found');
      }

      // 创建评审记录
      await prisma.dAOVerificationReview.create({
        data: {
          verificationId,
          reviewerId,
          decision: review.decision,
          comments: review.comments,
          evidenceChecked: JSON.stringify(review.evidenceChecked),
          votingPower: reviewer.votingPower
        }
      });

      // 更新验证状态
      await prisma.dAOMilestoneVerification.update({
        where: { id: verificationId },
        data: { status: 'UNDER_REVIEW' }
      });

      // 检查验证状态
      await this.checkVerificationStatus(verificationId);

      Logger.info('Verification review submitted', {
        verificationId,
        reviewerId,
        decision: review.decision
      });
    } catch (error) {
      Logger.error('Failed to submit verification review', { error });
      throw error;
    }
  }

  /**
   * 检查验证状态
   */
  private static async checkVerificationStatus(verificationId: string): Promise<void> {
    try {
      const verification = await prisma.dAOMilestoneVerification.findUnique({
        where: { id: verificationId },
        include: {
          reviews: true
        }
      });

      if (!verification) return;

      // 计算审批情况
      const totalVotingPower = await this.getTotalVerifierVotingPower(verificationId);
      const approvalPower = verification.reviews
        .filter(r => r.decision === 'APPROVE')
        .reduce((sum, r) => sum + r.votingPower, 0);
      const rejectionPower = verification.reviews
        .filter(r => r.decision === 'REJECT')
        .reduce((sum, r) => sum + r.votingPower, 0);

      const approvalPercentage = totalVotingPower > 0 ? (approvalPower / totalVotingPower) * 100 : 0;
      const rejectionPercentage = totalVotingPower > 0 ? (rejectionPower / totalVotingPower) * 100 : 0;

      // 更新当前审批数
      await prisma.dAOMilestoneVerification.update({
        where: { id: verificationId },
        data: { currentApprovals: approvalPercentage }
      });

      // 检查是否达到验证或拒绝条件
      if (approvalPercentage >= verification.verificationThreshold) {
        await this.verifyMilestone(verificationId);
      } else if (rejectionPercentage >= 50) { // 拒绝只需50%
        await this.rejectVerification(verificationId, 'Rejected by verifiers');
      }
    } catch (error) {
      Logger.error('Failed to check verification status', { error });
    }
  }

  /**
   * 验证里程碑
   */
  private static async verifyMilestone(verificationId: string): Promise<void> {
    try {
      const verification = await prisma.dAOMilestoneVerification.findUnique({
        where: { id: verificationId },
        include: {
          milestone: true
        }
      });

      if (!verification) return;

      // 更新验证状态
      await prisma.dAOMilestoneVerification.update({
        where: { id: verificationId },
        data: { 
          status: 'VERIFIED',
          verifiedAt: new Date()
        }
      });

      // 更新里程碑状态
      await prisma.dAOMilestone.update({
        where: { id: verification.milestoneId },
        data: { status: 'VERIFIED' }
      });

      // 如果设置了预算，自动处理付款
      if (verification.milestone.budget > 0) {
        await this.processMilestonePayment(verificationId);
      }

      Logger.info('Milestone verified', { verificationId });
    } catch (error) {
      Logger.error('Failed to verify milestone', { error });
    }
  }

  /**
   * 拒绝验证
   */
  private static async rejectVerification(verificationId: string, reason: string): Promise<void> {
    try {
      await prisma.dAOMilestoneVerification.update({
        where: { id: verificationId },
        data: { 
          status: 'REJECTED',
          rejectionReason: reason
        }
      });

      // 更新里程碑状态
      const verification = await prisma.dAOMilestoneVerification.findUnique({
        where: { id: verificationId }
      });

      if (verification) {
        await prisma.dAOMilestone.update({
          where: { id: verification.milestoneId },
          data: { status: 'IN_PROGRESS' } // 回到进行中状态
        });
      }

      Logger.info('Milestone verification rejected', { verificationId, reason });
    } catch (error) {
      Logger.error('Failed to reject verification', { error });
    }
  }

  /**
   * 处理里程碑付款
   */
  private static async processMilestonePayment(verificationId: string): Promise<void> {
    try {
      const verification = await prisma.dAOMilestoneVerification.findUnique({
        where: { id: verificationId },
        include: {
          milestone: {
            include: {
              project: true
            }
          }
        }
      });

      if (!verification) return;

      // 通过财务服务处理付款
      const transactionId = await TreasuryService.processMilestonePayment(
        verification.daoId,
        verification.projectId,
        verification.milestoneId,
        verification.milestone.budget,
        verification.submittedBy // 假设提交者为收款人，实际应该从项目信息中获取
      );

      // 更新验证状态
      await prisma.dAOMilestoneVerification.update({
        where: { id: verificationId },
        data: { 
          status: 'PAYMENT_PROCESSED',
          paymentTransactionId: transactionId
        }
      });

      // 更新里程碑状态
      await prisma.dAOMilestone.update({
        where: { id: verification.milestoneId },
        data: { status: 'PAID' }
      });

      Logger.info('Milestone payment processed', {
        verificationId,
        transactionId
      });
    } catch (error) {
      Logger.error('Failed to process milestone payment', { error });
    }
  }

  /**
   * 获取验证者的总投票权
   */
  private static async getTotalVerifierVotingPower(verificationId: string): Promise<number> {
    const verification = await prisma.dAOMilestoneVerification.findUnique({
      where: { id: verificationId }
    });

    if (!verification) return 0;

    const verifierIds = JSON.parse(verification.verifiers);
    const members = await prisma.dAOMember.findMany({
      where: { id: { in: verifierIds } }
    });

    return members.reduce((sum, member) => sum + member.votingPower, 0);
  }

  /**
   * 确定验证方法
   */
  private static determineVerificationMethod(milestone: any): MilestoneVerification['verificationMethod'] {
    // 根据里程碑预算和类型确定验证方法
    if (milestone.budget > 50000) {
      return 'EXTERNAL_AUDIT';
    } else if (milestone.budget > 10000) {
      return 'PEER_REVIEW';
    } else {
      return 'DELIVERABLE_SUBMISSION';
    }
  }

  /**
   * 选择验证者
   */
  private static async selectVerifiers(daoId: string, budget: number): Promise<string[]> {
    // 根据预算选择不同的验证者
    const roleFilter = budget > 25000 ? ['ADMIN'] : ['ADMIN', 'MEMBER'];
    
    const members = await prisma.dAOMember.findMany({
      where: {
        daoId,
        status: 'ACTIVE',
        role: { in: roleFilter },
        votingPower: { gt: 0 }
      },
      orderBy: { votingPower: 'desc' },
      take: budget > 25000 ? 5 : 3 // 高额度需要更多验证者
    });

    return members.map(m => m.id);
  }

  /**
   * 获取里程碑验证列表
   */
  static async getMilestoneVerifications(
    daoId: string,
    status?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<MilestoneVerification[]> {
    try {
      const where: any = { daoId };
      if (status) where.status = status;

      const verifications = await prisma.dAOMilestoneVerification.findMany({
        where,
        include: {
          milestone: {
            select: {
              title: true,
              budget: true
            }
          },
          project: {
            select: {
              title: true
            }
          },
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

      return verifications;
    } catch (error) {
      Logger.error('Failed to get milestone verifications', { error });
      throw error;
    }
  }

  /**
   * 获取单个验证详情
   */
  static async getMilestoneVerification(verificationId: string): Promise<MilestoneVerification | null> {
    try {
      const verification = await prisma.dAOMilestoneVerification.findUnique({
        where: { id: verificationId },
        include: {
          milestone: {
            include: {
              project: {
                select: {
                  title: true,
                  description: true
                }
              }
            }
          },
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
          }
        }
      });

      return verification;
    } catch (error) {
      Logger.error('Failed to get milestone verification', { error });
      throw error;
    }
  }
}