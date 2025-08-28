import { Request, Response } from 'express';
import { ResponseUtil } from '@/utils/response';
import { Logger } from '@/utils/logger';
import { prisma } from '@/services/database';
import { AuthenticatedRequest } from '@/types';

export class DAOTasksController {
  /**
   * Get tasks for a project
   */
  static async getTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const { status, assigneeId, priority, page = '1', limit = '20' } = req.query;
      
      const where: any = { projectId };
      if (status) where.status = status;
      if (assigneeId) where.assigneeId = assigneeId;
      if (priority) where.priority = priority;
      
      const tasks = await prisma.dAOTask.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string)
      });
      
      ResponseUtil.success(res, tasks);
    } catch (error) {
      Logger.error('Error fetching tasks', { error });
      ResponseUtil.error(res, 'Failed to fetch tasks');
    }
  }
  
  /**
   * Get single task with details
   */
  static async getTask(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const task = await prisma.dAOTask.findUnique({
        where: { id },
        include: {
          project: {
            include: {
              dao: true
            }
          }
        }
      });
      
      if (!task) {
        ResponseUtil.notFound(res, 'Task not found');
        return;
      }
      
      ResponseUtil.success(res, task);
    } catch (error) {
      Logger.error('Error fetching task', { error });
      ResponseUtil.error(res, 'Failed to fetch task');
    }
  }
  
  /**
   * Create new task
   */
  static async createTask(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        ResponseUtil.unauthorized(res);
        return;
      }
      
      const { projectId } = req.params;
      const {
        title,
        description,
        priority,
        assigneeId,
        costEstimate,
        tokenReward,
        dueDate,
        tags
      } = req.body;

      Logger.info('🚀 Creating task', { 
        projectId, 
        userId, 
        title,
        description,
        priority,
        assigneeId,
        costEstimate,
        tokenReward,
        dueDate,
        tags,
        bodyType: typeof req.body,
        body: req.body
      });
      
      // Check if project exists and user has permission
      const project = await prisma.dAOProject.findUnique({
        where: { id: projectId },
        include: {
          dao: {
            include: {
              members: {
                where: { userId }
              }
            }
          }
        }
      });
      
      if (!project) {
        Logger.error('Project not found', { projectId });
        ResponseUtil.notFound(res, 'Project not found');
        return;
      }
      
      // Check if user is member of DAO (can be ADMIN or MEMBER for task creation)
      const member = project.dao.members[0];
      if (!member) {
        Logger.error('User is not DAO member', { projectId, userId });
        ResponseUtil.forbidden(res, 'Only DAO members can create tasks');
        return;
      }
      
      // Create task
      const task = await prisma.dAOTask.create({
        data: {
          projectId,
          title,
          description,
          priority: priority?.toUpperCase() || 'MEDIUM',
          assigneeId: assigneeId || null,
          costEstimate: costEstimate || 0,
          tokenReward: tokenReward || 0,
          dueDate: dueDate ? new Date(dueDate) : null,
          tags: tags ? JSON.stringify(tags) : null,
          createdBy: userId
        }
      });
      
      Logger.info('Task created', { 
        taskId: task.id,
        projectId,
        createdBy: userId
      });
      
      ResponseUtil.success(res, task, 'Task created successfully');
    } catch (error) {
      Logger.error('Error creating task', { error });
      ResponseUtil.error(res, 'Failed to create task');
    }
  }
  
  /**
   * Update task
   */
  static async updateTask(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      const task = await prisma.dAOTask.findUnique({
        where: { id },
        include: {
          project: {
            include: {
              dao: {
                include: {
                  members: {
                    where: { userId }
                  }
                }
              }
            }
          }
        }
      });
      
      if (!task) {
        ResponseUtil.notFound(res, 'Task not found');
        return;
      }
      
      // Check permissions - task assignee, task creator, or DAO admin can update
      const member = task.project.dao.members[0];
      const canUpdate = task.assigneeId === userId || 
                       task.createdBy === userId || 
                       member?.role === 'ADMIN';
      
      if (!canUpdate) {
        ResponseUtil.forbidden(res, 'Insufficient permissions to update task');
        return;
      }
      
      const updateData: any = { ...req.body };
      
      // Set completion date if status is being changed to COMPLETED
      if (updateData.status === 'COMPLETED' && task.status !== 'COMPLETED') {
        updateData.completedDate = new Date();
      }
      
      // Handle tags and attachments as JSON
      if (updateData.tags) {
        updateData.tags = JSON.stringify(updateData.tags);
      }
      if (updateData.attachments) {
        updateData.attachments = JSON.stringify(updateData.attachments);
      }
      
      const updatedTask = await prisma.dAOTask.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
      });
      
      Logger.info('Task updated', { 
        taskId: id,
        updatedBy: userId,
        status: updatedTask.status
      });
      
      ResponseUtil.success(res, updatedTask, 'Task updated successfully');
    } catch (error) {
      Logger.error('Error updating task', { error });
      ResponseUtil.error(res, 'Failed to update task');
    }
  }
  
  /**
   * Delete task
   */
  static async deleteTask(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      const task = await prisma.dAOTask.findUnique({
        where: { id },
        include: {
          project: {
            include: {
              dao: {
                include: {
                  members: {
                    where: { userId }
                  }
                }
              }
            }
          }
        }
      });
      
      if (!task) {
        ResponseUtil.notFound(res, 'Task not found');
        return;
      }
      
      // Check permissions - task creator or DAO admin can delete
      const member = task.project.dao.members[0];
      const canDelete = task.createdBy === userId || member?.role === 'ADMIN';
      
      if (!canDelete) {
        ResponseUtil.forbidden(res, 'Insufficient permissions to delete task');
        return;
      }
      
      await prisma.dAOTask.delete({
        where: { id }
      });
      
      Logger.info('Task deleted', { 
        taskId: id,
        deletedBy: userId
      });
      
      ResponseUtil.success(res, null, 'Task deleted successfully');
    } catch (error) {
      Logger.error('Error deleting task', { error });
      ResponseUtil.error(res, 'Failed to delete task');
    }
  }
}