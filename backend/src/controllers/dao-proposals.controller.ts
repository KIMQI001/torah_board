import { Request, Response } from 'express';
import { ResponseUtil } from '@/utils/response';
import { Logger } from '@/utils/logger';
import { prisma } from '@/services/database';
import { AuthenticatedRequest } from '@/types';

export class DAOProposalsController {
  /**
   * Get proposals for a DAO
   */
  static async getProposals(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { daoId } = req.params;
      const { status, category, page = '1', limit = '20' } = req.query;
      
      const where: any = { daoId };
      if (status) where.status = status;
      if (category) where.category = category;
      
      const proposals = await prisma.dAOProposal.findMany({
        where,
        include: {
          votes: {
            include: {
              member: {
                select: {
                  address: true,
                  votingPower: true
                }
              }
            }
          },
          _count: {
            select: { votes: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string)
      });
      
      ResponseUtil.success(res, proposals);
    } catch (error) {
      Logger.error('Error fetching proposals', { error });
      ResponseUtil.error(res, 'Failed to fetch proposals');
    }
  }
  
  /**
   * Get single proposal
   */
  static async getProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const proposal = await prisma.dAOProposal.findUnique({
        where: { id },
        include: {
          dao: {
            select: {
              name: true,
              governanceToken: true
            }
          },
          votes: {
            include: {
              member: {
                include: {
                  user: {
                    select: {
                      walletAddress: true
                    }
                  }
                }
              }
            }
          },
          _count: {
            select: { votes: true }
          }
        }
      });
      
      if (!proposal) {
        ResponseUtil.notFound(res, 'Proposal not found');
        return;
      }
      
      ResponseUtil.success(res, proposal);
    } catch (error) {
      Logger.error('Error fetching proposal', { error });
      ResponseUtil.error(res, 'Failed to fetch proposal');
    }
  }
  
  /**
   * Create new proposal
   */
  static async createProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        ResponseUtil.unauthorized(res);
        return;
      }
      
      const { daoId } = req.params;
      const {
        title,
        description,
        category,
        requestedAmount,
        votingPeriodDays,
        threshold,
        discussion,
        attachments
      } = req.body;
      
      // Check if user is member of DAO
      const member = await prisma.dAOMember.findFirst({
        where: { daoId, userId }
      });
      
      if (!member) {
        ResponseUtil.forbidden(res, 'You must be a DAO member to create proposals');
        return;
      }
      
      // Get DAO settings
      const dao = await prisma.dAO.findUnique({
        where: { id: daoId }
      });
      
      if (!dao) {
        ResponseUtil.notFound(res, 'DAO not found');
        return;
      }
      
      const now = new Date();
      const votingDays = votingPeriodDays || dao.votingPeriod;
      const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Start tomorrow
      const endTime = new Date(startTime.getTime() + votingDays * 24 * 60 * 60 * 1000);
      
      const proposal = await prisma.dAOProposal.create({
        data: {
          daoId,
          title,
          description,
          proposer: member.address,
          status: 'DRAFT',
          category: category.toUpperCase(),
          requestedAmount,
          quorum: dao.quorumThreshold,
          threshold: threshold || 60,
          startTime,
          endTime,
          discussion,
          attachments: attachments ? JSON.stringify(attachments) : null
        }
      });
      
      // Update member's proposal count
      await prisma.dAOMember.update({
        where: { id: member.id },
        data: { 
          proposalsCreated: { increment: 1 },
          lastActivity: now
        }
      });
      
      Logger.info('Proposal created', { 
        proposalId: proposal.id,
        daoId,
        createdBy: userId
      });
      
      ResponseUtil.success(res, proposal, 'Proposal created successfully');
    } catch (error) {
      Logger.error('Error creating proposal', { error });
      ResponseUtil.error(res, 'Failed to create proposal');
    }
  }
  
  /**
   * Vote on proposal
   */
  static async voteOnProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        ResponseUtil.unauthorized(res);
        return;
      }
      
      const { id } = req.params;
      const { voteType, reason } = req.body;
      
      // Get proposal
      const proposal = await prisma.dAOProposal.findUnique({
        where: { id }
      });
      
      if (!proposal) {
        ResponseUtil.notFound(res, 'Proposal not found');
        return;
      }
      
      // Check if proposal is active
      const now = new Date();
      if (proposal.status !== 'ACTIVE' || now > proposal.endTime || now < proposal.startTime) {
        ResponseUtil.error(res, 'Voting is not active for this proposal');
        return;
      }
      
      // Check if user is member of DAO
      const member = await prisma.dAOMember.findFirst({
        where: { 
          daoId: proposal.daoId, 
          userId 
        }
      });
      
      if (!member) {
        ResponseUtil.forbidden(res, 'You must be a DAO member to vote');
        return;
      }
      
      // Check if already voted
      const existingVote = await prisma.dAOVote.findUnique({
        where: {
          proposalId_memberId: {
            proposalId: id,
            memberId: member.id
          }
        }
      });
      
      if (existingVote) {
        ResponseUtil.error(res, 'You have already voted on this proposal');
        return;
      }
      
      // Create vote
      const vote = await prisma.dAOVote.create({
        data: {
          proposalId: id,
          memberId: member.id,
          voteType: voteType.toUpperCase(),
          votingPower: member.votingPower,
          reason
        }
      });
      
      // Update proposal vote counts
      const voteField = voteType === 'FOR' ? 'votesFor' :
                       voteType === 'AGAINST' ? 'votesAgainst' : 'votesAbstain';
      
      await prisma.dAOProposal.update({
        where: { id },
        data: {
          [voteField]: { increment: member.votingPower },
          totalVotes: { increment: member.votingPower }
        }
      });
      
      // Update member activity
      await prisma.dAOMember.update({
        where: { id: member.id },
        data: {
          votesParticipated: { increment: 1 },
          lastActivity: now
        }
      });
      
      Logger.info('Vote cast', {
        proposalId: id,
        memberId: member.id,
        voteType,
        votingPower: member.votingPower
      });
      
      ResponseUtil.success(res, vote, 'Vote cast successfully');
    } catch (error) {
      Logger.error('Error voting on proposal', { error });
      ResponseUtil.error(res, 'Failed to cast vote');
    }
  }
  
  /**
   * Activate proposal (move from DRAFT to ACTIVE)
   */
  static async activateProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      const proposal = await prisma.dAOProposal.findUnique({
        where: { id },
        include: {
          dao: true
        }
      });
      
      if (!proposal) {
        ResponseUtil.notFound(res, 'Proposal not found');
        return;
      }
      
      // Check if user is admin or proposal creator
      const member = await prisma.dAOMember.findFirst({
        where: {
          daoId: proposal.daoId,
          userId
        }
      });
      
      if (!member || (member.role !== 'ADMIN' && member.address !== proposal.proposer)) {
        ResponseUtil.forbidden(res, 'Only admins or proposal creator can activate proposals');
        return;
      }
      
      if (proposal.status !== 'DRAFT') {
        ResponseUtil.error(res, 'Only draft proposals can be activated');
        return;
      }
      
      const updatedProposal = await prisma.dAOProposal.update({
        where: { id },
        data: { status: 'ACTIVE' }
      });
      
      Logger.info('Proposal activated', { proposalId: id });
      
      ResponseUtil.success(res, updatedProposal, 'Proposal activated successfully');
    } catch (error) {
      Logger.error('Error activating proposal', { error });
      ResponseUtil.error(res, 'Failed to activate proposal');
    }
  }
  
  /**
   * Execute proposal after voting passes
   */
  static async executeProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      const proposal = await prisma.dAOProposal.findUnique({
        where: { id },
        include: {
          dao: true
        }
      });
      
      if (!proposal) {
        ResponseUtil.notFound(res, 'Proposal not found');
        return;
      }
      
      // Check if user is admin
      const member = await prisma.dAOMember.findFirst({
        where: {
          daoId: proposal.daoId,
          userId,
          role: 'ADMIN'
        }
      });
      
      if (!member) {
        ResponseUtil.forbidden(res, 'Only admins can execute proposals');
        return;
      }
      
      // Check if proposal has passed
      const now = new Date();
      if (proposal.status !== 'ACTIVE' || now < proposal.endTime) {
        ResponseUtil.error(res, 'Proposal must finish voting before execution');
        return;
      }
      
      // Check if proposal met quorum and threshold
      const quorumMet = proposal.totalVotes >= proposal.quorum;
      const thresholdMet = proposal.totalVotes > 0 && 
        (proposal.votesFor / proposal.totalVotes) * 100 >= proposal.threshold;
      
      if (!quorumMet || !thresholdMet) {
        // Mark as failed
        await prisma.dAOProposal.update({
          where: { id },
          data: { status: 'FAILED' }
        });
        
        ResponseUtil.error(res, 'Proposal did not meet quorum or threshold requirements');
        return;
      }
      
      // Execute proposal (create treasury transaction if needed)
      if (proposal.requestedAmount && proposal.requestedAmount > 0) {
        await prisma.dAOTreasury.create({
          data: {
            daoId: proposal.daoId,
            type: 'INVESTMENT',
            amount: proposal.requestedAmount,
            token: 'USDC', // Default token
            description: `Execution of proposal: ${proposal.title}`,
            proposalId: id,
            status: 'PENDING'
          }
        });
      }
      
      const updatedProposal = await prisma.dAOProposal.update({
        where: { id },
        data: {
          status: 'EXECUTED',
          executionTime: now
        }
      });
      
      Logger.info('Proposal executed', { 
        proposalId: id,
        executedBy: userId
      });
      
      ResponseUtil.success(res, updatedProposal, 'Proposal executed successfully');
    } catch (error) {
      Logger.error('Error executing proposal', { error });
      ResponseUtil.error(res, 'Failed to execute proposal');
    }
  }
  
  /**
   * Cancel proposal
   */
  static async cancelProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      const proposal = await prisma.dAOProposal.findUnique({
        where: { id }
      });
      
      if (!proposal) {
        ResponseUtil.notFound(res, 'Proposal not found');
        return;
      }
      
      // Check if user is admin or proposal creator
      const member = await prisma.dAOMember.findFirst({
        where: {
          daoId: proposal.daoId,
          userId
        }
      });
      
      if (!member || (member.role !== 'ADMIN' && member.address !== proposal.proposer)) {
        ResponseUtil.forbidden(res, 'Only admins or proposal creator can cancel proposals');
        return;
      }
      
      if (['EXECUTED', 'CANCELLED'].includes(proposal.status)) {
        ResponseUtil.error(res, 'Cannot cancel an executed or already cancelled proposal');
        return;
      }
      
      const updatedProposal = await prisma.dAOProposal.update({
        where: { id },
        data: { status: 'CANCELLED' }
      });
      
      Logger.info('Proposal cancelled', { proposalId: id });
      
      ResponseUtil.success(res, updatedProposal, 'Proposal cancelled successfully');
    } catch (error) {
      Logger.error('Error cancelling proposal', { error });
      ResponseUtil.error(res, 'Failed to cancel proposal');
    }
  }
}