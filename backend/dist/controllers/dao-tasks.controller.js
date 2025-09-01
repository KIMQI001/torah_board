"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAOTasksController = void 0;
const response_1 = require("@/utils/response");
const logger_1 = require("@/utils/logger");
const database_1 = require("@/services/database");
class DAOTasksController {
    /**
     * Get tasks for a project
     */
    static async getTasks(req, res) {
        try {
            const { projectId } = req.params;
            const { status, assigneeId, priority, page = '1', limit = '20' } = req.query;
            const where = { projectId };
            if (status)
                where.status = status;
            if (assigneeId)
                where.assigneeId = assigneeId;
            if (priority)
                where.priority = priority;
            const tasks = await database_1.prisma.dAOTask.findMany({
                where,
                orderBy: [
                    { priority: 'desc' },
                    { createdAt: 'desc' }
                ],
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit)
            });
            response_1.ResponseUtil.success(res, tasks);
        }
        catch (error) {
            logger_1.Logger.error('Error fetching tasks', { error });
            response_1.ResponseUtil.error(res, 'Failed to fetch tasks');
        }
    }
    /**
     * Get single task with details
     */
    static async getTask(req, res) {
        try {
            const { id } = req.params;
            const task = await database_1.prisma.dAOTask.findUnique({
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
                response_1.ResponseUtil.notFound(res, 'Task not found');
                return;
            }
            response_1.ResponseUtil.success(res, task);
        }
        catch (error) {
            logger_1.Logger.error('Error fetching task', { error });
            response_1.ResponseUtil.error(res, 'Failed to fetch task');
        }
    }
    /**
     * Create new task
     */
    static async createTask(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            const { projectId } = req.params;
            const { title, description, priority, assigneeId, costEstimate, tokenReward, dueDate, tags } = req.body;
            logger_1.Logger.info('🚀 Creating task', {
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
            const project = await database_1.prisma.dAOProject.findUnique({
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
                logger_1.Logger.error('Project not found', { projectId });
                response_1.ResponseUtil.notFound(res, 'Project not found');
                return;
            }
            // Check if user is member of DAO (can be ADMIN or MEMBER for task creation)
            const member = project.dao.members[0];
            if (!member) {
                logger_1.Logger.error('User is not DAO member', { projectId, userId });
                response_1.ResponseUtil.forbidden(res, 'Only DAO members can create tasks');
                return;
            }
            // Create task
            const task = await database_1.prisma.dAOTask.create({
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
            logger_1.Logger.info('Task created', {
                taskId: task.id,
                projectId,
                createdBy: userId
            });
            response_1.ResponseUtil.success(res, task, 'Task created successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error creating task', { error });
            response_1.ResponseUtil.error(res, 'Failed to create task');
        }
    }
    /**
     * Update task
     */
    static async updateTask(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const task = await database_1.prisma.dAOTask.findUnique({
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
                response_1.ResponseUtil.notFound(res, 'Task not found');
                return;
            }
            // Check permissions - task assignee, task creator, or DAO admin can update
            const member = task.project.dao.members[0];
            const canUpdate = task.assigneeId === userId ||
                task.createdBy === userId ||
                member?.role === 'ADMIN';
            if (!canUpdate) {
                response_1.ResponseUtil.forbidden(res, 'Insufficient permissions to update task');
                return;
            }
            const updateData = { ...req.body };
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
            const updatedTask = await database_1.prisma.dAOTask.update({
                where: { id },
                data: {
                    ...updateData,
                    updatedAt: new Date()
                }
            });
            logger_1.Logger.info('Task updated', {
                taskId: id,
                updatedBy: userId,
                status: updatedTask.status
            });
            response_1.ResponseUtil.success(res, updatedTask, 'Task updated successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error updating task', { error });
            response_1.ResponseUtil.error(res, 'Failed to update task');
        }
    }
    /**
     * Delete task
     */
    static async deleteTask(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const task = await database_1.prisma.dAOTask.findUnique({
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
                response_1.ResponseUtil.notFound(res, 'Task not found');
                return;
            }
            // Check permissions - task creator or DAO admin can delete
            const member = task.project.dao.members[0];
            const canDelete = task.createdBy === userId || member?.role === 'ADMIN';
            if (!canDelete) {
                response_1.ResponseUtil.forbidden(res, 'Insufficient permissions to delete task');
                return;
            }
            await database_1.prisma.dAOTask.delete({
                where: { id }
            });
            logger_1.Logger.info('Task deleted', {
                taskId: id,
                deletedBy: userId
            });
            response_1.ResponseUtil.success(res, null, 'Task deleted successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error deleting task', { error });
            response_1.ResponseUtil.error(res, 'Failed to delete task');
        }
    }
}
exports.DAOTasksController = DAOTasksController;
//# sourceMappingURL=dao-tasks.controller.js.map