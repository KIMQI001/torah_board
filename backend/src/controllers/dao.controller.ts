import { Request, Response } from 'express';
import { ResponseUtil } from '@/utils/response';
import { Logger } from '@/utils/logger';
import { prisma } from '@/services/database';
import { AuthenticatedRequest } from '@/types';

export class DAOController {
  /**
   * Get all DAOs or user's DAOs
   */
  static async getDAOs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.query;
      
      const where = userId ? {
        members: {
          some: {
            userId: userId as string
          }
        }
      } : {};
      
      const daos = await prisma.dAO.findMany({
        where,
        include: {
          _count: {
            select: {
              members: true,
              proposals: true,
              projects: true
            }
          }
        }
      });
      
      ResponseUtil.success(res, daos);
    } catch (error) {
      Logger.error('Error fetching DAOs', { error });
      ResponseUtil.error(res, 'Failed to fetch DAOs');
    }
  }
  
  /**
   * Get DAO by ID
   */
  static async getDAO(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const dao = await prisma.dAO.findUnique({
        where: { id },
        include: {
          members: {
            include: {
              user: {
                select: {
                  walletAddress: true
                }
              }
            }
          },
          proposals: {
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          projects: {
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          treasury: {
            orderBy: { timestamp: 'desc' },
            take: 20
          },
          distributions: true,
          _count: {
            select: {
              members: true,
              proposals: true,
              projects: true
            }
          }
        }
      });
      
      if (!dao) {
        ResponseUtil.notFound(res, 'DAO not found');
        return;
      }
      
      ResponseUtil.success(res, dao);
    } catch (error) {
      Logger.error('Error fetching DAO', { error });
      ResponseUtil.error(res, 'Failed to fetch DAO');
    }
  }
  
  /**
   * Create new DAO
   */
  static async createDAO(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        ResponseUtil.unauthorized(res);
        return;
      }
      
      const { 
        name, 
        description, 
        treasuryAddress, 
        governanceToken,
        totalSupply,
        quorumThreshold,
        votingPeriod
      } = req.body;
      
      // Check if DAO name already exists
      const existing = await prisma.dAO.findUnique({
        where: { name }
      });
      
      if (existing) {
        ResponseUtil.error(res, 'DAO name already exists');
        return;
      }
      
      // Create DAO with creator as admin member
      const dao = await prisma.dAO.create({
        data: {
          name,
          description,
          treasuryAddress,
          governanceToken,
          totalSupply: totalSupply || 1000000,
          quorumThreshold: quorumThreshold || 50,
          votingPeriod: votingPeriod || 7,
          createdBy: userId,
          members: {
            create: {
              userId,
              address: req.user.walletAddress,
              role: 'ADMIN',
              votingPower: totalSupply ? totalSupply * 0.1 : 100000, // Give creator 10% voting power
              reputation: 100,
              contributionScore: 100
            }
          }
        },
        include: {
          members: true,
          _count: {
            select: {
              members: true,
              proposals: true,
              projects: true
            }
          }
        }
      });
      
      Logger.info('DAO created', { 
        daoId: dao.id, 
        name: dao.name, 
        createdBy: userId 
      });
      
      ResponseUtil.success(res, dao, 'DAO created successfully');
    } catch (error) {
      Logger.error('Error creating DAO', { error });
      ResponseUtil.error(res, 'Failed to create DAO');
    }
  }
  
  /**
   * Update DAO
   */
  static async updateDAO(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      // Check if user is admin of this DAO
      const member = await prisma.dAOMember.findFirst({
        where: {
          daoId: id,
          userId,
          role: 'ADMIN'
        }
      });
      
      if (!member) {
        ResponseUtil.forbidden(res, 'Only DAO admins can update DAO settings');
        return;
      }
      
      const updates = req.body;
      delete updates.id;
      delete updates.createdBy;
      
      const dao = await prisma.dAO.update({
        where: { id },
        data: updates
      });
      
      Logger.info('DAO updated', { daoId: id, updates });
      
      ResponseUtil.success(res, dao, 'DAO updated successfully');
    } catch (error) {
      Logger.error('Error updating DAO', { error });
      ResponseUtil.error(res, 'Failed to update DAO');
    }
  }
  
  /**
   * Join DAO as member
   */
  static async joinDAO(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        ResponseUtil.unauthorized(res);
        return;
      }
      
      // Check if already a member
      const existing = await prisma.dAOMember.findFirst({
        where: {
          daoId: id,
          userId
        }
      });
      
      if (existing) {
        ResponseUtil.error(res, 'You are already a member of this DAO');
        return;
      }
      
      // Create member entry
      const member = await prisma.dAOMember.create({
        data: {
          daoId: id,
          userId,
          address: req.user.walletAddress,
          role: 'MEMBER',
          votingPower: 1000 // Default voting power
        }
      });
      
      Logger.info('User joined DAO', { userId, daoId: id });
      
      ResponseUtil.success(res, member, 'Successfully joined DAO');
    } catch (error) {
      Logger.error('Error joining DAO', { error });
      ResponseUtil.error(res, 'Failed to join DAO');
    }
  }
  
  /**
   * Leave DAO
   */
  static async leaveDAO(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        ResponseUtil.unauthorized(res);
        return;
      }
      
      // Check if user is admin (admins cannot leave)
      const member = await prisma.dAOMember.findFirst({
        where: {
          daoId: id,
          userId
        }
      });
      
      if (!member) {
        ResponseUtil.error(res, 'You are not a member of this DAO');
        return;
      }
      
      if (member.role === 'ADMIN') {
        // Check if there are other admins
        const otherAdmins = await prisma.dAOMember.count({
          where: {
            daoId: id,
            role: 'ADMIN',
            userId: { not: userId }
          }
        });
        
        if (otherAdmins === 0) {
          ResponseUtil.error(res, 'Cannot leave DAO as the only admin');
          return;
        }
      }
      
      await prisma.dAOMember.delete({
        where: { id: member.id }
      });
      
      Logger.info('User left DAO', { userId, daoId: id });
      
      ResponseUtil.success(res, null, 'Successfully left DAO');
    } catch (error) {
      Logger.error('Error leaving DAO', { error });
      ResponseUtil.error(res, 'Failed to leave DAO');
    }
  }
  
  /**
   * Get DAO statistics
   */
  static async getDAOStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const [
        memberCount,
        activeProposals,
        activeProjects,
        treasuryTransactions,
        totalDistributed
      ] = await Promise.all([
        prisma.dAOMember.count({ where: { daoId: id } }),
        prisma.dAOProposal.count({ 
          where: { daoId: id, status: 'ACTIVE' } 
        }),
        prisma.dAOProject.count({ 
          where: { daoId: id, status: 'ACTIVE' } 
        }),
        prisma.dAOTreasury.findMany({
          where: { daoId: id },
          select: {
            type: true,
            amount: true,
            token: true,
            status: true
          }
        }),
        prisma.dAODistribution.aggregate({
          where: { daoId: id },
          _sum: { totalDistributed: true }
        })
      ]);
      
      // Calculate treasury balance by token
      const treasuryBalance: Record<string, number> = {};
      treasuryTransactions.forEach(tx => {
        if (tx.status === 'CONFIRMED') {
          if (!treasuryBalance[tx.token]) {
            treasuryBalance[tx.token] = 0;
          }
          if (tx.type === 'DEPOSIT') {
            treasuryBalance[tx.token] += tx.amount;
          } else if (['WITHDRAWAL', 'INVESTMENT', 'REWARD', 'FEE', 'MILESTONE_PAYMENT'].includes(tx.type)) {
            treasuryBalance[tx.token] -= tx.amount;
          }
        }
      });
      
      const stats = {
        memberCount,
        activeProposals,
        activeProjects,
        treasuryBalance,
        totalDistributed: totalDistributed._sum.totalDistributed || 0
      };
      
      ResponseUtil.success(res, stats);
    } catch (error) {
      Logger.error('Error fetching DAO stats', { error });
      ResponseUtil.error(res, 'Failed to fetch DAO statistics');
    }
  }
  
  /**
   * Delete DAO (Admin only)
   */
  static async deleteDAO(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        ResponseUtil.unauthorized(res);
        return;
      }
      
      // Check if user is admin of this DAO
      const member = await prisma.dAOMember.findFirst({
        where: {
          daoId: id,
          userId,
          role: 'ADMIN'
        }
      });
      
      if (!member) {
        ResponseUtil.forbidden(res, 'Only DAO admins can delete the DAO');
        return;
      }
      
      // Check if DAO exists
      const dao = await prisma.dAO.findUnique({
        where: { id }
      });
      
      if (!dao) {
        ResponseUtil.notFound(res, 'DAO not found');
        return;
      }
      
      // Delete DAO and all related data (cascade delete)
      await prisma.dAO.delete({
        where: { id }
      });
      
      Logger.info('DAO deleted', { daoId: id, deletedBy: userId });
      
      ResponseUtil.success(res, null, 'DAO deleted successfully');
    } catch (error) {
      Logger.error('Error deleting DAO', { error });
      ResponseUtil.error(res, 'Failed to delete DAO');
    }
  }
}