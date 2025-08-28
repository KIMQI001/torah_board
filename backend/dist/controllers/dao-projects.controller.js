"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAOProjectsController = void 0;
const response_1 = require("@/utils/response");
const logger_1 = require("@/utils/logger");
const database_1 = require("@/services/database");
class DAOProjectsController {
    /**
     * Get projects for a DAO
     */
    static async getProjects(req, res) {
        try {
            const { daoId } = req.params;
            const { status, category, page = '1', limit = '20' } = req.query;
            const where = { daoId };
            if (status)
                where.status = status;
            if (category)
                where.category = category;
            const projects = await database_1.prisma.dAOProject.findMany({
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
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit)
            });
            response_1.ResponseUtil.success(res, projects);
        }
        catch (error) {
            logger_1.Logger.error('Error fetching projects', { error });
            response_1.ResponseUtil.error(res, 'Failed to fetch projects');
        }
    }
    /**
     * Get single project with details
     */
    static async getProject(req, res) {
        try {
            const { id } = req.params;
            const project = await database_1.prisma.dAOProject.findUnique({
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
                response_1.ResponseUtil.notFound(res, 'Project not found');
                return;
            }
            response_1.ResponseUtil.success(res, project);
        }
        catch (error) {
            logger_1.Logger.error('Error fetching project', { error });
            response_1.ResponseUtil.error(res, 'Failed to fetch project');
        }
    }
    /**
     * Create new project
     */
    static async createProject(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            const { daoId } = req.params;
            const { title, description, category, totalBudget, roi, riskLevel, teamMembers, startDate, expectedEndDate, milestones } = req.body;
            logger_1.Logger.info('Creating project', {
                daoId,
                userId,
                title,
                startDate,
                expectedEndDate
            });
            // Check if DAO exists
            const dao = await database_1.prisma.dAO.findUnique({
                where: { id: daoId }
            });
            if (!dao) {
                logger_1.Logger.error('DAO not found', { daoId });
                response_1.ResponseUtil.notFound(res, 'DAO not found');
                return;
            }
            // Check if user is admin of DAO
            const member = await database_1.prisma.dAOMember.findFirst({
                where: {
                    daoId,
                    userId,
                    role: 'ADMIN'
                }
            });
            if (!member) {
                logger_1.Logger.error('User is not DAO admin', { daoId, userId });
                response_1.ResponseUtil.forbidden(res, 'Only DAO admins can create projects');
                return;
            }
            // Create project with milestones
            const project = await database_1.prisma.dAOProject.create({
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
                        create: milestones.map((m) => ({
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
            logger_1.Logger.info('Project created', {
                projectId: project.id,
                daoId,
                createdBy: userId
            });
            response_1.ResponseUtil.success(res, project, 'Project created successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error creating project', { error });
            response_1.ResponseUtil.error(res, 'Failed to create project');
        }
    }
    /**
     * Update project
     */
    static async updateProject(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const project = await database_1.prisma.dAOProject.findUnique({
                where: { id }
            });
            if (!project) {
                response_1.ResponseUtil.notFound(res, 'Project not found');
                return;
            }
            // Check if user is admin of DAO
            const member = await database_1.prisma.dAOMember.findFirst({
                where: {
                    daoId: project.daoId,
                    userId,
                    role: 'ADMIN'
                }
            });
            if (!member) {
                response_1.ResponseUtil.forbidden(res, 'Only DAO admins can update projects');
                return;
            }
            const updates = req.body;
            delete updates.id;
            delete updates.daoId;
            delete updates.createdBy;
            // Handle date conversions
            if (updates.startDate)
                updates.startDate = new Date(updates.startDate);
            if (updates.expectedEndDate)
                updates.expectedEndDate = new Date(updates.expectedEndDate);
            if (updates.completedDate)
                updates.completedDate = new Date(updates.completedDate);
            // Handle JSON fields
            if (updates.teamMembers)
                updates.teamMembers = JSON.stringify(updates.teamMembers);
            const updatedProject = await database_1.prisma.dAOProject.update({
                where: { id },
                data: updates,
                include: {
                    milestones: true
                }
            });
            logger_1.Logger.info('Project updated', { projectId: id, updates });
            response_1.ResponseUtil.success(res, updatedProject, 'Project updated successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error updating project', { error });
            response_1.ResponseUtil.error(res, 'Failed to update project');
        }
    }
    /**
     * Delete project
     */
    static async deleteProject(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const project = await database_1.prisma.dAOProject.findUnique({
                where: { id }
            });
            if (!project) {
                response_1.ResponseUtil.notFound(res, 'Project not found');
                return;
            }
            // Check if user is admin of DAO
            const member = await database_1.prisma.dAOMember.findFirst({
                where: {
                    daoId: project.daoId,
                    userId,
                    role: 'ADMIN'
                }
            });
            if (!member) {
                response_1.ResponseUtil.forbidden(res, 'Only DAO admins can delete projects');
                return;
            }
            // Check if project has spent funds
            if (project.spentFunds > 0) {
                response_1.ResponseUtil.error(res, 'Cannot delete project with spent funds');
                return;
            }
            await database_1.prisma.dAOProject.delete({
                where: { id }
            });
            logger_1.Logger.info('Project deleted', { projectId: id });
            response_1.ResponseUtil.success(res, null, 'Project deleted successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error deleting project', { error });
            response_1.ResponseUtil.error(res, 'Failed to delete project');
        }
    }
    /**
     * Add milestone to project
     */
    static async addMilestone(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const project = await database_1.prisma.dAOProject.findUnique({
                where: { id }
            });
            if (!project) {
                response_1.ResponseUtil.notFound(res, 'Project not found');
                return;
            }
            // Check if user is admin of DAO
            const member = await database_1.prisma.dAOMember.findFirst({
                where: {
                    daoId: project.daoId,
                    userId,
                    role: 'ADMIN'
                }
            });
            if (!member) {
                response_1.ResponseUtil.forbidden(res, 'Only DAO admins can add milestones');
                return;
            }
            const { title, description, targetDate, budget, deliverables, verificationReq } = req.body;
            const milestone = await database_1.prisma.dAOMilestone.create({
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
            logger_1.Logger.info('Milestone added', {
                milestoneId: milestone.id,
                projectId: id
            });
            response_1.ResponseUtil.success(res, milestone, 'Milestone added successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error adding milestone', { error });
            response_1.ResponseUtil.error(res, 'Failed to add milestone');
        }
    }
    /**
     * Update milestone status
     */
    static async updateMilestone(req, res) {
        try {
            const { projectId, milestoneId } = req.params;
            const { status, completedDate } = req.body;
            const userId = req.user?.id;
            // Get milestone with project
            const milestone = await database_1.prisma.dAOMilestone.findFirst({
                where: {
                    id: milestoneId,
                    projectId
                },
                include: {
                    project: true
                }
            });
            if (!milestone) {
                response_1.ResponseUtil.notFound(res, 'Milestone not found');
                return;
            }
            // Check if user is admin or team member
            const member = await database_1.prisma.dAOMember.findFirst({
                where: {
                    daoId: milestone.project.daoId,
                    userId
                }
            });
            if (!member) {
                response_1.ResponseUtil.forbidden(res, 'You must be a DAO member to update milestones');
                return;
            }
            const teamMembers = JSON.parse(milestone.project.teamMembers || '[]');
            if (member.role !== 'ADMIN' && !teamMembers.includes(member.address)) {
                response_1.ResponseUtil.forbidden(res, 'Only admins or team members can update milestones');
                return;
            }
            // Update milestone
            const updatedMilestone = await database_1.prisma.dAOMilestone.update({
                where: { id: milestoneId },
                data: {
                    status: status.toUpperCase(),
                    completedDate: completedDate ? new Date(completedDate) : undefined
                }
            });
            // If milestone is completed, update project spending
            if (status === 'PAID') {
                await database_1.prisma.dAOProject.update({
                    where: { id: projectId },
                    data: {
                        spentFunds: { increment: milestone.budget },
                        allocatedFunds: { decrement: milestone.budget }
                    }
                });
                // Create treasury transaction
                await database_1.prisma.dAOTreasury.create({
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
            logger_1.Logger.info('Milestone updated', {
                milestoneId,
                status,
                updatedBy: userId
            });
            response_1.ResponseUtil.success(res, updatedMilestone, 'Milestone updated successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error updating milestone', { error });
            response_1.ResponseUtil.error(res, 'Failed to update milestone');
        }
    }
}
exports.DAOProjectsController = DAOProjectsController;
//# sourceMappingURL=dao-projects.controller.js.map