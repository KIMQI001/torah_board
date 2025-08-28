import { Request, Response } from 'express';
import { ResponseUtil } from '@/utils/response';
import { Logger } from '@/utils/logger';
import { prisma } from '@/services/database';
import { AuthenticatedRequest } from '@/types';

export class DAOProjectsController {
  /**
   * Get projects for a DAO
   */
  static async getProjects(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { daoId } = req.params;
      const { status, category, page = '1', limit = '20' } = req.query;
      
      const where: any = { daoId };
      if (status) where.status = status;
      if (category) where.category = category;
      
      const projects = await prisma.dAOProject.findMany({
        where,
        include: {
          milestones: {
            orderBy: { targetDate: 'asc' }
          },
          _count: {
            select: { milestones: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string)
      });
      
      ResponseUtil.success(res, projects);
    } catch (error) {
      Logger.error('Error fetching projects', { error });
      ResponseUtil.error(res, 'Failed to fetch projects');
    }
  }
  
  /**
   * Get single project with details
   */
  static async getProject(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const project = await prisma.dAOProject.findUnique({
        where: { id },
        include: {
          dao: {
            select: {
              name: true,
              governanceToken: true
            }
          },
          milestones: {
            orderBy: { targetDate: 'asc' }
          }
        }
      });
      
      if (!project) {
        ResponseUtil.notFound(res, 'Project not found');
        return;
      }
      
      ResponseUtil.success(res, project);
    } catch (error) {
      Logger.error('Error fetching project', { error });
      ResponseUtil.error(res, 'Failed to fetch project');
    }
  }
  
  /**
   * Create new project
   */
  static async createProject(req: AuthenticatedRequest, res: Response): Promise<void> {
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
        totalBudget,
        roi,
        riskLevel,
        teamMembers,
        startDate,
        expectedEndDate,
        milestones
      } = req.body;
      
      // Check if user is admin of DAO
      const member = await prisma.dAOMember.findFirst({
        where: { 
          daoId, 
          userId,
          role: 'ADMIN'
        }
      });
      
      if (!member) {
        ResponseUtil.forbidden(res, 'Only DAO admins can create projects');
        return;
      }
      
      // Create project with milestones
      const project = await prisma.dAOProject.create({
        data: {
          daoId,
          title,
          description,
          category,
          totalBudget,
          roi: roi || 0,
          riskLevel: riskLevel.toUpperCase(),
          teamMembers: JSON.stringify(teamMembers || []),
          startDate: new Date(startDate),
          expectedEndDate: new Date(expectedEndDate),
          createdBy: userId,
          milestones: milestones ? {
            create: milestones.map((m: any) => ({
              title: m.title,
              description: m.description,
              targetDate: new Date(m.targetDate),
              budget: m.budget,
              deliverables: JSON.stringify(m.deliverables || []),
              verificationReq: m.verificationReq || 51
            }))
          } : undefined
        },
        include: {
          milestones: true
        }
      });
      
      Logger.info('Project created', { 
        projectId: project.id,
        daoId,
        createdBy: userId
      });
      
      ResponseUtil.success(res, project, 'Project created successfully');
    } catch (error) {
      Logger.error('Error creating project', { error });
      ResponseUtil.error(res, 'Failed to create project');
    }
  }
  
  /**
   * Update project
   */
  static async updateProject(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      const project = await prisma.dAOProject.findUnique({
        where: { id }
      });
      
      if (!project) {
        ResponseUtil.notFound(res, 'Project not found');
        return;
      }
      
      // Check if user is admin of DAO
      const member = await prisma.dAOMember.findFirst({
        where: { 
          daoId: project.daoId, 
          userId,
          role: 'ADMIN'
        }
      });
      
      if (!member) {
        ResponseUtil.forbidden(res, 'Only DAO admins can update projects');
        return;
      }
      
      const updates = req.body;
      delete updates.id;
      delete updates.daoId;
      delete updates.createdBy;
      
      // Handle date conversions
      if (updates.startDate) updates.startDate = new Date(updates.startDate);
      if (updates.expectedEndDate) updates.expectedEndDate = new Date(updates.expectedEndDate);
      if (updates.completedDate) updates.completedDate = new Date(updates.completedDate);
      
      // Handle JSON fields
      if (updates.teamMembers) updates.teamMembers = JSON.stringify(updates.teamMembers);
      
      const updatedProject = await prisma.dAOProject.update({
        where: { id },
        data: updates,
        include: {
          milestones: true
        }
      });
      
      Logger.info('Project updated', { projectId: id, updates });
      
      ResponseUtil.success(res, updatedProject, 'Project updated successfully');
    } catch (error) {
      Logger.error('Error updating project', { error });
      ResponseUtil.error(res, 'Failed to update project');
    }
  }
  
  /**
   * Delete project
   */
  static async deleteProject(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      const project = await prisma.dAOProject.findUnique({
        where: { id }
      });
      
      if (!project) {
        ResponseUtil.notFound(res, 'Project not found');
        return;
      }
      
      // Check if user is admin of DAO
      const member = await prisma.dAOMember.findFirst({
        where: { 
          daoId: project.daoId, 
          userId,
          role: 'ADMIN'
        }
      });
      
      if (!member) {
        ResponseUtil.forbidden(res, 'Only DAO admins can delete projects');
        return;
      }
      
      // Check if project has spent funds
      if (project.spentFunds > 0) {
        ResponseUtil.error(res, 'Cannot delete project with spent funds');
        return;
      }
      
      await prisma.dAOProject.delete({
        where: { id }
      });
      
      Logger.info('Project deleted', { projectId: id });
      
      ResponseUtil.success(res, null, 'Project deleted successfully');
    } catch (error) {
      Logger.error('Error deleting project', { error });
      ResponseUtil.error(res, 'Failed to delete project');
    }
  }
  
  /**
   * Add milestone to project
   */
  static async addMilestone(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      const project = await prisma.dAOProject.findUnique({
        where: { id }
      });
      
      if (!project) {
        ResponseUtil.notFound(res, 'Project not found');
        return;
      }
      
      // Check if user is admin of DAO
      const member = await prisma.dAOMember.findFirst({
        where: { 
          daoId: project.daoId, 
          userId,
          role: 'ADMIN'
        }
      });
      
      if (!member) {
        ResponseUtil.forbidden(res, 'Only DAO admins can add milestones');
        return;
      }
      
      const {
        title,
        description,
        targetDate,
        budget,
        deliverables,
        verificationReq
      } = req.body;
      
      const milestone = await prisma.dAOMilestone.create({
        data: {
          projectId: id,
          title,
          description,
          targetDate: new Date(targetDate),
          budget,
          deliverables: JSON.stringify(deliverables || []),
          verificationReq: verificationReq || 51
        }
      });
      
      Logger.info('Milestone added', { 
        milestoneId: milestone.id,
        projectId: id
      });
      
      ResponseUtil.success(res, milestone, 'Milestone added successfully');
    } catch (error) {
      Logger.error('Error adding milestone', { error });
      ResponseUtil.error(res, 'Failed to add milestone');
    }
  }
  
  /**
   * Update milestone status
   */
  static async updateMilestone(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { projectId, milestoneId } = req.params;
      const { status, completedDate } = req.body;
      const userId = req.user?.id;
      
      // Get milestone with project
      const milestone = await prisma.dAOMilestone.findFirst({
        where: { 
          id: milestoneId,
          projectId
        },
        include: {
          project: true
        }
      });
      
      if (!milestone) {
        ResponseUtil.notFound(res, 'Milestone not found');
        return;
      }
      
      // Check if user is admin or team member
      const member = await prisma.dAOMember.findFirst({
        where: { 
          daoId: milestone.project.daoId, 
          userId
        }
      });
      
      if (!member) {
        ResponseUtil.forbidden(res, 'You must be a DAO member to update milestones');
        return;
      }
      
      const teamMembers = JSON.parse(milestone.project.teamMembers || '[]');
      if (member.role !== 'ADMIN' && !teamMembers.includes(member.address)) {
        ResponseUtil.forbidden(res, 'Only admins or team members can update milestones');
        return;
      }
      
      // Update milestone
      const updatedMilestone = await prisma.dAOMilestone.update({
        where: { id: milestoneId },
        data: {
          status: status.toUpperCase(),
          completedDate: completedDate ? new Date(completedDate) : undefined
        }
      });
      
      // If milestone is completed, update project spending
      if (status === 'PAID') {
        await prisma.dAOProject.update({
          where: { id: projectId },
          data: {
            spentFunds: { increment: milestone.budget },
            allocatedFunds: { decrement: milestone.budget }
          }
        });
        
        // Create treasury transaction
        await prisma.dAOTreasury.create({
          data: {
            daoId: milestone.project.daoId,
            type: 'MILESTONE_PAYMENT',
            amount: milestone.budget,
            token: 'USDC',
            description: `Milestone payment: ${milestone.title}`,
            projectId,
            status: 'CONFIRMED'
          }
        });
      }
      
      Logger.info('Milestone updated', { 
        milestoneId,
        status,
        updatedBy: userId
      });
      
      ResponseUtil.success(res, updatedMilestone, 'Milestone updated successfully');
    } catch (error) {
      Logger.error('Error updating milestone', { error });
      ResponseUtil.error(res, 'Failed to update milestone');
    }
  }
}