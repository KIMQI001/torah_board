import { Request, Response } from 'express';
import { ResponseUtil } from '@/utils/response';
import { Logger } from '@/utils/logger';
import { prisma } from '@/services/database';
import { AuthenticatedRequest } from '@/types';

export class DAOMembersController {
  /**
   * Get members for a DAO
   */
  static async getMembers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { daoId } = req.params;
      const { role, status, page = '1', limit = '50' } = req.query;
      
      const where: any = { daoId };
      if (role) where.role = role;
      if (status) where.status = status;
      
      const members = await prisma.dAOMember.findMany({
        where,
        include: {
          user: {
            select: {
              walletAddress: true,
              createdAt: true,
              lastLogin: true
            }
          },
          _count: {
            select: { votes: true }
          }
        },
        orderBy: [
          { role: 'asc' },
          { votingPower: 'desc' }
        ],
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string)
      });
      
      ResponseUtil.success(res, members);
    } catch (error) {
      Logger.error('Error fetching members', { error });
      ResponseUtil.error(res, 'Failed to fetch members');
    }
  }
  
  /**
   * Get member details
   */
  static async getMember(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { daoId, memberId } = req.params;
      
      const member = await prisma.dAOMember.findFirst({
        where: { 
          id: memberId,
          daoId 
        },
        include: {
          user: {
            select: {
              walletAddress: true,
              createdAt: true,
              lastLogin: true
            }
          },
          votes: {
            include: {
              proposal: {
                select: {
                  title: true,
                  status: true
                }
              }
            },
            orderBy: { timestamp: 'desc' },
            take: 10
          }
        }
      });
      
      if (!member) {
        ResponseUtil.notFound(res, 'Member not found');
        return;
      }
      
      ResponseUtil.success(res, member);
    } catch (error) {
      Logger.error('Error fetching member', { error });
      ResponseUtil.error(res, 'Failed to fetch member');
    }
  }
  
  /**
   * Update member role (Admin only)
   */
  static async updateMemberRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { daoId, memberId } = req.params;
      const { role } = req.body;
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
        ResponseUtil.forbidden(res, 'Only admins can update member roles');
        return;
      }
      
      // Check if member exists
      const member = await prisma.dAOMember.findFirst({
        where: { id: memberId, daoId }
      });
      
      if (!member) {
        ResponseUtil.notFound(res, 'Member not found');
        return;
      }
      
      // Prevent self-demotion of last admin
      if (member.userId === userId && member.role === 'ADMIN' && role !== 'ADMIN') {
        const otherAdmins = await prisma.dAOMember.count({
          where: {
            daoId,
            role: 'ADMIN',
            id: { not: memberId }
          }
        });
        
        if (otherAdmins === 0) {
          ResponseUtil.error(res, 'Cannot demote the last admin');
          return;
        }
      }
      
      const updatedMember = await prisma.dAOMember.update({
        where: { id: memberId },
        data: { 
          role: role.toUpperCase(),
          lastActivity: new Date()
        }
      });
      
      Logger.info('Member role updated', {
        memberId,
        daoId,
        newRole: role,
        updatedBy: userId
      });
      
      ResponseUtil.success(res, updatedMember, 'Member role updated successfully');
    } catch (error) {
      Logger.error('Error updating member role', { error });
      ResponseUtil.error(res, 'Failed to update member role');
    }
  }
  
  /**
   * Update member voting power (Admin only)
   */
  static async updateVotingPower(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { daoId, memberId } = req.params;
      const { votingPower } = req.body;
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
        ResponseUtil.forbidden(res, 'Only admins can update voting power');
        return;
      }
      
      const updatedMember = await prisma.dAOMember.update({
        where: { id: memberId },
        data: { 
          votingPower: parseFloat(votingPower),
          lastActivity: new Date()
        }
      });
      
      Logger.info('Member voting power updated', {
        memberId,
        daoId,
        newVotingPower: votingPower,
        updatedBy: userId
      });
      
      ResponseUtil.success(res, updatedMember, 'Voting power updated successfully');
    } catch (error) {
      Logger.error('Error updating voting power', { error });
      ResponseUtil.error(res, 'Failed to update voting power');
    }
  }
  
  /**
   * Remove member from DAO (Admin only)
   */
  static async removeMember(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { daoId, memberId } = req.params;
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
        ResponseUtil.forbidden(res, 'Only admins can remove members');
        return;
      }
      
      // Check if member exists
      const member = await prisma.dAOMember.findFirst({
        where: { id: memberId, daoId }
      });
      
      if (!member) {
        ResponseUtil.notFound(res, 'Member not found');
        return;
      }
      
      // Prevent removal of last admin
      if (member.role === 'ADMIN') {
        const otherAdmins = await prisma.dAOMember.count({
          where: {
            daoId,
            role: 'ADMIN',
            id: { not: memberId }
          }
        });
        
        if (otherAdmins === 0) {
          ResponseUtil.error(res, 'Cannot remove the last admin');
          return;
        }
      }
      
      await prisma.dAOMember.delete({
        where: { id: memberId }
      });
      
      Logger.info('Member removed from DAO', {
        memberId,
        daoId,
        removedBy: userId
      });
      
      ResponseUtil.success(res, null, 'Member removed successfully');
    } catch (error) {
      Logger.error('Error removing member', { error });
      ResponseUtil.error(res, 'Failed to remove member');
    }
  }
  
  /**
   * Get member activity (voting history, proposals created)
   */
  static async getMemberActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { daoId, memberId } = req.params;
      
      const member = await prisma.dAOMember.findFirst({
        where: { id: memberId, daoId },
        include: {
          votes: {
            include: {
              proposal: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  createdAt: true
                }
              }
            },
            orderBy: { timestamp: 'desc' }
          }
        }
      });
      
      if (!member) {
        ResponseUtil.notFound(res, 'Member not found');
        return;
      }
      
      // Get proposals created by this member
      const proposalsCreated = await prisma.dAOProposal.findMany({
        where: {
          daoId,
          proposer: member.address
        },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
      
      const activity = {
        member: {
          id: member.id,
          address: member.address,
          role: member.role,
          votingPower: member.votingPower,
          reputation: member.reputation,
          contributionScore: member.contributionScore,
          joinDate: member.joinDate,
          lastActivity: member.lastActivity,
          proposalsCreated: member.proposalsCreated,
          votesParticipated: member.votesParticipated
        },
        recentVotes: member.votes,
        proposalsCreated
      };
      
      ResponseUtil.success(res, activity);
    } catch (error) {
      Logger.error('Error fetching member activity', { error });
      ResponseUtil.error(res, 'Failed to fetch member activity');
    }
  }
  
  /**
   * Update member contribution score
   */
  static async updateContributionScore(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { daoId, memberId } = req.params;
      const { contributionScore, reason } = req.body;
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
        ResponseUtil.forbidden(res, 'Only admins can update contribution scores');
        return;
      }
      
      const updatedMember = await prisma.dAOMember.update({
        where: { id: memberId },
        data: { 
          contributionScore: parseFloat(contributionScore),
          lastActivity: new Date()
        }
      });
      
      Logger.info('Member contribution score updated', {
        memberId,
        daoId,
        newScore: contributionScore,
        reason,
        updatedBy: userId
      });
      
      ResponseUtil.success(res, updatedMember, 'Contribution score updated successfully');
    } catch (error) {
      Logger.error('Error updating contribution score', { error });
      ResponseUtil.error(res, 'Failed to update contribution score');
    }
  }
}