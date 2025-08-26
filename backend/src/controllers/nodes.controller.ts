import { Response } from 'express';
import { ResponseUtil } from '@/utils/response';
import { Logger } from '@/utils/logger';
import { prisma } from '@/services/database';
import { ExternalApiService } from '@/services/external-api.service';
import { AuthenticatedRequest, CreateNodeRequest, UpdateNodeRequest, NodePerformanceData } from '@/types';

export class NodesController {
  /**
   * Get all user nodes with optional filtering and pagination
   */
  static async getUserNodes(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const {
        page = 1,
        limit = 20,
        status,
        projectId,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build where clause for filtering
      const where: any = {
        userId: req.user.id
      };

      if (status) {
        where.status = status;
      }

      if (projectId) {
        where.projectId = projectId;
      }

      // Get total count for pagination
      const total = await prisma.userNode.count({ where });

      // Get nodes with pagination and project info
      const nodes = await prisma.userNode.findMany({
        where,
        orderBy: {
          [sortBy as string]: sortOrder
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          project: {
            select: {
              id: true,
              name: true,
              category: true,
              blockchain: true
            }
          }
        }
      });

      // Transform response to match frontend expectations
      const transformedNodes = nodes.map(node => ({
        id: node.id,
        network: node.project.name,
        nodeId: node.nodeId,
        type: node.type,
        capacity: node.capacity || 'Querying...',
        earnings: node.earnings,
        status: node.status.toLowerCase(),
        uptime: node.uptime,
        location: node.location,
        startDate: node.startDate.toISOString().split('T')[0],
        totalEarned: node.totalEarned,
        hardware: node.hardware ? JSON.parse(node.hardware) : [],
        monitorUrl: node.monitorUrl,
        project: node.project,
        createdAt: node.createdAt,
        updatedAt: node.updatedAt
      }));

      ResponseUtil.paginated(
        res,
        transformedNodes,
        {
          page: Number(page),
          limit: Number(limit),
          total
        },
        'Nodes retrieved successfully'
      );

    } catch (error) {
      Logger.error('Error getting user nodes', { 
        error: error.message, 
        userId: req.user?.id 
      });
      ResponseUtil.serverError(res);
    }
  }

  /**
   * Get a single node by ID
   */
  static async getNode(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { id } = req.params;

      const node = await prisma.userNode.findFirst({
        where: {
          id,
          userId: req.user.id // Ensure user can only access their own nodes
        },
        include: {
          project: true,
          performances: {
            orderBy: {
              timestamp: 'desc'
            },
            take: 1 // Latest performance data
          }
        }
      });

      if (!node) {
        ResponseUtil.notFound(res, 'Node not found');
        return;
      }

      const transformedNode = {
        id: node.id,
        network: node.project.name,
        nodeId: node.nodeId,
        type: node.type,
        capacity: node.capacity || 'Querying...',
        earnings: node.earnings,
        status: node.status.toLowerCase(),
        uptime: node.uptime,
        location: node.location,
        startDate: node.startDate.toISOString().split('T')[0],
        totalEarned: node.totalEarned,
        hardware: node.hardware ? JSON.parse(node.hardware) : [],
        monitorUrl: node.monitorUrl,
        project: node.project,
        performance: node.performances.length > 0 ? {
          cpuUsage: node.performances[0].cpuUsage,
          memoryUsage: node.performances[0].memoryUsage,
          diskUsage: node.performances[0].diskUsage,
          networkLatency: node.performances[0].networkLatency,
          bandwidthUp: node.performances[0].bandwidthUp,
          bandwidthDown: node.performances[0].bandwidthDown,
          timestamp: node.performances[0].timestamp
        } : null,
        createdAt: node.createdAt,
        updatedAt: node.updatedAt
      };

      ResponseUtil.success(res, transformedNode, 'Node retrieved successfully');

    } catch (error) {
      Logger.error('Error getting node', { 
        error: error.message, 
        userId: req.user?.id 
      });
      ResponseUtil.serverError(res);
    }
  }

  /**
   * Create new nodes (supports batch creation)
   */
  static async createNodes(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { nodeIds, projectId, type, capacity, location, monitorUrl, hardware } = req.body as CreateNodeRequest;

      // Check if project exists
      const project = await prisma.dePINProject.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        ResponseUtil.notFound(res, 'Project not found');
        return;
      }

      // Check for duplicate node IDs for this user
      const existingNodes = await prisma.userNode.findMany({
        where: {
          userId: req.user.id,
          nodeId: {
            in: nodeIds
          }
        },
        select: {
          nodeId: true
        }
      });

      if (existingNodes.length > 0) {
        const duplicateIds = existingNodes.map(node => node.nodeId);
        ResponseUtil.error(res, `Node IDs already exist: ${duplicateIds.join(', ')}`);
        return;
      }

      // Create nodes in batch
      const createdNodes = [];
      const failedNodes = [];

      for (const nodeId of nodeIds) {
        try {
          const node = await prisma.userNode.create({
            data: {
              userId: req.user.id,
              projectId,
              nodeId,
              type,
              capacity: capacity || null, // Will be updated by capacity query service
              location,
              monitorUrl,
              hardware: hardware ? JSON.stringify(hardware) : null,
              status: 'SYNCING' // Start as syncing, will be updated by monitoring
            },
            include: {
              project: {
                select: {
                  name: true,
                  category: true,
                  blockchain: true
                }
              }
            }
          });

          createdNodes.push({
            id: node.id,
            network: node.project.name,
            nodeId: node.nodeId,
            type: node.type,
            capacity: node.capacity || 'Querying...',
            earnings: node.earnings,
            status: node.status.toLowerCase(),
            uptime: node.uptime,
            location: node.location,
            startDate: node.startDate.toISOString().split('T')[0],
            totalEarned: node.totalEarned,
            hardware: node.hardware ? JSON.parse(node.hardware) : [],
            monitorUrl: node.monitorUrl,
            project: node.project,
            createdAt: node.createdAt,
            updatedAt: node.updatedAt
          });

          Logger.info('Node created', {
            userId: req.user.id,
            nodeId,
            projectId,
            projectName: project.name
          });

        } catch (error) {
          Logger.error('Failed to create node', {
            error: error.message,
            userId: req.user.id,
            nodeId
          });
          failedNodes.push({ nodeId, error: error.message });
        }
      }

      // TODO: Trigger capacity query for nodes without capacity
      // This will be implemented in the external API service

      const responseData = {
        created: createdNodes,
        failed: failedNodes,
        summary: {
          total: nodeIds.length,
          created: createdNodes.length,
          failed: failedNodes.length
        }
      };

      if (createdNodes.length === 0) {
        ResponseUtil.error(res, 'No nodes were created', 400);
        return;
      }

      ResponseUtil.success(res, responseData, 
        `Successfully created ${createdNodes.length} of ${nodeIds.length} nodes`);

    } catch (error) {
      Logger.error('Error creating nodes', { 
        error: error.message, 
        userId: req.user?.id 
      });
      ResponseUtil.serverError(res);
    }
  }

  /**
   * Update a node
   */
  static async updateNode(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { id } = req.params;
      const updates = req.body as UpdateNodeRequest;

      // Check if node exists and belongs to user
      const existingNode = await prisma.userNode.findFirst({
        where: {
          id,
          userId: req.user.id
        }
      });

      if (!existingNode) {
        ResponseUtil.notFound(res, 'Node not found');
        return;
      }

      // Update node
      const updatedNode = await prisma.userNode.update({
        where: { id },
        data: {
          ...updates,
          hardware: updates.hardware ? JSON.stringify(updates.hardware) : undefined,
          updatedAt: new Date()
        },
        include: {
          project: {
            select: {
              name: true,
              category: true,
              blockchain: true
            }
          }
        }
      });

      Logger.info('Node updated', {
        userId: req.user.id,
        nodeId: updatedNode.nodeId,
        updates: Object.keys(updates)
      });

      const transformedNode = {
        id: updatedNode.id,
        network: updatedNode.project.name,
        nodeId: updatedNode.nodeId,
        type: updatedNode.type,
        capacity: updatedNode.capacity || 'Querying...',
        earnings: updatedNode.earnings,
        status: updatedNode.status.toLowerCase(),
        uptime: updatedNode.uptime,
        location: updatedNode.location,
        startDate: updatedNode.startDate.toISOString().split('T')[0],
        totalEarned: updatedNode.totalEarned,
        hardware: updatedNode.hardware ? JSON.parse(updatedNode.hardware) : [],
        monitorUrl: updatedNode.monitorUrl,
        project: updatedNode.project,
        createdAt: updatedNode.createdAt,
        updatedAt: updatedNode.updatedAt
      };

      ResponseUtil.success(res, transformedNode, 'Node updated successfully');

    } catch (error) {
      Logger.error('Error updating node', { 
        error: error.message, 
        userId: req.user?.id 
      });
      ResponseUtil.serverError(res);
    }
  }

  /**
   * Delete a node
   */
  static async deleteNode(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { id } = req.params;

      // Check if node exists and belongs to user
      const existingNode = await prisma.userNode.findFirst({
        where: {
          id,
          userId: req.user.id
        },
        include: {
          project: {
            select: { name: true }
          }
        }
      });

      if (!existingNode) {
        ResponseUtil.notFound(res, 'Node not found');
        return;
      }

      // Delete node (this will also cascade delete performance records)
      await prisma.userNode.delete({
        where: { id }
      });

      Logger.info('Node deleted', {
        userId: req.user.id,
        nodeId: existingNode.nodeId,
        projectName: existingNode.project.name
      });

      ResponseUtil.success(res, null, 'Node deleted successfully');

    } catch (error) {
      Logger.error('Error deleting node', { 
        error: error.message, 
        userId: req.user?.id 
      });
      ResponseUtil.serverError(res);
    }
  }

  /**
   * Update node performance data
   */
  static async updateNodePerformance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { id } = req.params;
      const performanceData = req.body as NodePerformanceData;

      // Check if node exists and belongs to user
      const node = await prisma.userNode.findFirst({
        where: {
          id,
          userId: req.user.id
        }
      });

      if (!node) {
        ResponseUtil.notFound(res, 'Node not found');
        return;
      }

      // Create new performance record
      const performance = await prisma.nodePerformance.create({
        data: {
          nodeId: id,
          cpuUsage: performanceData.cpuUsage,
          memoryUsage: performanceData.memoryUsage,
          diskUsage: performanceData.diskUsage,
          networkLatency: performanceData.networkLatency,
          bandwidthUp: performanceData.bandwidthUp,
          bandwidthDown: performanceData.bandwidthDown
        }
      });

      // Update node status to online if it was syncing
      if (node.status === 'SYNCING') {
        await prisma.userNode.update({
          where: { id },
          data: { status: 'ONLINE' }
        });
      }

      Logger.info('Node performance updated', {
        userId: req.user.id,
        nodeId: node.nodeId,
        performanceId: performance.id
      });

      ResponseUtil.success(res, {
        id: performance.id,
        nodeId: id,
        ...performanceData,
        timestamp: performance.timestamp
      }, 'Performance data updated successfully');

    } catch (error) {
      Logger.error('Error updating node performance', { 
        error: error.message, 
        userId: req.user?.id 
      });
      ResponseUtil.serverError(res);
    }
  }

  /**
   * Get node performance history
   */
  static async getNodePerformanceHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { id } = req.params;
      const { 
        hours = 24, 
        limit = 100,
        sortOrder = 'desc' 
      } = req.query;

      // Check if node exists and belongs to user
      const node = await prisma.userNode.findFirst({
        where: {
          id,
          userId: req.user.id
        },
        select: { id: true, nodeId: true }
      });

      if (!node) {
        ResponseUtil.notFound(res, 'Node not found');
        return;
      }

      // Calculate time range
      const hoursAgo = new Date(Date.now() - Number(hours) * 60 * 60 * 1000);

      // Get performance history
      const performances = await prisma.nodePerformance.findMany({
        where: {
          nodeId: id,
          timestamp: {
            gte: hoursAgo
          }
        },
        orderBy: {
          timestamp: sortOrder as 'asc' | 'desc'
        },
        take: Number(limit)
      });

      ResponseUtil.success(res, {
        nodeId: node.nodeId,
        timeRange: {
          hours: Number(hours),
          from: hoursAgo.toISOString(),
          to: new Date().toISOString()
        },
        data: performances
      }, 'Performance history retrieved successfully');

    } catch (error) {
      Logger.error('Error getting node performance history', { 
        error: error.message, 
        userId: req.user?.id 
      });
      ResponseUtil.serverError(res);
    }
  }

  /**
   * Update capacity for a specific node
   */
  static async updateNodeCapacity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { id } = req.params;

      const success = await ExternalApiService.updateSingleNodeCapacity(id, req.user.id);

      if (!success) {
        ResponseUtil.error(res, 'Failed to update node capacity');
        return;
      }

      // Get updated node data
      const node = await prisma.userNode.findFirst({
        where: { id, userId: req.user.id },
        include: {
          project: {
            select: {
              name: true,
              category: true,
              blockchain: true
            }
          }
        }
      });

      if (!node) {
        ResponseUtil.notFound(res, 'Node not found');
        return;
      }

      const transformedNode = {
        id: node.id,
        network: node.project.name,
        nodeId: node.nodeId,
        type: node.type,
        capacity: node.capacity || 'Querying...',
        earnings: node.earnings,
        status: node.status.toLowerCase(),
        uptime: node.uptime,
        location: node.location,
        startDate: node.startDate.toISOString().split('T')[0],
        totalEarned: node.totalEarned,
        hardware: node.hardware ? JSON.parse(node.hardware) : [],
        monitorUrl: node.monitorUrl,
        project: node.project,
        createdAt: node.createdAt,
        updatedAt: node.updatedAt
      };

      ResponseUtil.success(res, transformedNode, 'Node capacity updated successfully');

    } catch (error) {
      Logger.error('Error updating node capacity', { 
        error: error.message, 
        userId: req.user?.id 
      });
      ResponseUtil.serverError(res);
    }
  }

  /**
   * Batch update capacities for all nodes without capacity
   */
  static async batchUpdateCapacities(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const results = await ExternalApiService.updateNodeCapacities(req.user.id);

      ResponseUtil.success(res, results, 
        `Batch capacity update completed: ${results.updated} updated, ${results.failed} failed`);

    } catch (error) {
      Logger.error('Error in batch capacity update', { 
        error: error.message, 
        userId: req.user?.id 
      });
      ResponseUtil.serverError(res);
    }
  }
}