"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsController = void 0;
const response_1 = require("@/utils/response");
const logger_1 = require("@/utils/logger");
const database_1 = require("@/services/database");
class ProjectsController {
    /**
     * Get all DePIN projects with optional filtering and pagination
     */
    static async getProjects(req, res) {
        try {
            const { page = 1, limit = 20, category, riskLevel, blockchain, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
            // Build where clause for filtering
            const where = {
                status: 'ACTIVE' // Only show active projects by default
            };
            if (category) {
                where.category = category;
            }
            if (riskLevel) {
                where.riskLevel = riskLevel;
            }
            if (blockchain) {
                where.blockchain = {
                    contains: blockchain,
                    mode: 'insensitive'
                };
            }
            // Get total count for pagination
            const total = await database_1.prisma.dePINProject.count({ where });
            // Get projects with pagination
            const projects = await database_1.prisma.dePINProject.findMany({
                where,
                orderBy: {
                    [sortBy]: sortOrder
                },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
                include: {
                    _count: {
                        select: {
                            nodes: true
                        }
                    }
                }
            });
            // Transform the response to match frontend expectations
            const transformedProjects = projects.map(project => ({
                id: project.id,
                name: project.name,
                category: project.category.toLowerCase(),
                description: project.description,
                nodes: project._count.nodes.toString(),
                capacity: 'N/A', // Can be calculated based on actual nodes
                rewards: 'N/A', // Can be calculated based on performance
                apy: project.apy,
                status: project.status.toLowerCase(),
                blockchain: project.blockchain,
                tokenSymbol: project.tokenSymbol,
                tokenPrice: project.tokenPrice,
                marketCap: project.marketCap,
                volume24h: project.volume24h,
                hardwareRequirement: project.hardwareRequirements,
                minInvestment: project.minInvestment,
                roiPeriod: project.roiPeriod,
                geographicFocus: project.geographicFocus,
                riskLevel: project.riskLevel.toLowerCase(),
                websiteUrl: project.websiteUrl,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt
            }));
            response_1.ResponseUtil.paginated(res, transformedProjects, {
                page: Number(page),
                limit: Number(limit),
                total
            }, 'Projects retrieved successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error getting projects', { error: error.message });
            response_1.ResponseUtil.serverError(res);
        }
    }
    /**
     * Get a single project by ID
     */
    static async getProject(req, res) {
        try {
            const { id } = req.params;
            const project = await database_1.prisma.dePINProject.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: {
                            nodes: true
                        }
                    },
                    nodes: {
                        select: {
                            id: true,
                            nodeId: true,
                            status: true,
                            capacity: true,
                            location: true
                        },
                        take: 10 // Limit to recent nodes
                    }
                }
            });
            if (!project) {
                response_1.ResponseUtil.notFound(res, 'Project not found');
                return;
            }
            const transformedProject = {
                id: project.id,
                name: project.name,
                category: project.category.toLowerCase(),
                description: project.description,
                nodes: project._count.nodes.toString(),
                capacity: 'N/A',
                rewards: 'N/A',
                apy: project.apy,
                status: project.status.toLowerCase(),
                blockchain: project.blockchain,
                tokenSymbol: project.tokenSymbol,
                tokenPrice: project.tokenPrice,
                marketCap: project.marketCap,
                volume24h: project.volume24h,
                hardwareRequirement: project.hardwareRequirements,
                minInvestment: project.minInvestment,
                roiPeriod: project.roiPeriod,
                geographicFocus: project.geographicFocus,
                riskLevel: project.riskLevel.toLowerCase(),
                websiteUrl: project.websiteUrl,
                recentNodes: project.nodes,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt
            };
            response_1.ResponseUtil.success(res, transformedProject, 'Project retrieved successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error getting project', { error: error.message });
            response_1.ResponseUtil.serverError(res);
        }
    }
    /**
     * Create a new DePIN project (Admin only)
     */
    static async createProject(req, res) {
        try {
            const projectData = req.body;
            // Check if project name already exists
            const existingProject = await database_1.prisma.dePINProject.findUnique({
                where: { name: projectData.name }
            });
            if (existingProject) {
                response_1.ResponseUtil.error(res, 'Project with this name already exists');
                return;
            }
            // Create new project
            const project = await database_1.prisma.dePINProject.create({
                data: {
                    name: projectData.name,
                    category: projectData.category,
                    description: projectData.description,
                    blockchain: projectData.blockchain,
                    tokenSymbol: projectData.tokenSymbol,
                    tokenPrice: projectData.tokenPrice || 0,
                    apy: projectData.apy,
                    minInvestment: projectData.minInvestment,
                    roiPeriod: projectData.roiPeriod,
                    geographicFocus: JSON.stringify(projectData.geographicFocus),
                    riskLevel: projectData.riskLevel,
                    hardwareRequirements: JSON.stringify(projectData.hardwareRequirements),
                    websiteUrl: projectData.websiteUrl,
                    status: 'ACTIVE'
                }
            });
            logger_1.Logger.info('New DePIN project created', {
                projectId: project.id,
                name: project.name,
                category: project.category,
                userId: req.user?.id
            });
            const transformedProject = {
                id: project.id,
                name: project.name,
                category: project.category.toLowerCase(),
                description: project.description,
                nodes: '0',
                capacity: '0 TiB',
                rewards: '$0/day',
                apy: project.apy,
                status: project.status.toLowerCase(),
                blockchain: project.blockchain,
                tokenSymbol: project.tokenSymbol,
                tokenPrice: project.tokenPrice,
                marketCap: project.marketCap,
                volume24h: project.volume24h,
                hardwareRequirement: project.hardwareRequirements,
                minInvestment: project.minInvestment,
                roiPeriod: project.roiPeriod,
                geographicFocus: project.geographicFocus,
                riskLevel: project.riskLevel.toLowerCase(),
                websiteUrl: project.websiteUrl,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt
            };
            response_1.ResponseUtil.success(res, transformedProject, 'Project created successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error creating project', { error: error.message });
            response_1.ResponseUtil.serverError(res);
        }
    }
    /**
     * Update an existing project (Admin only)
     */
    static async updateProject(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            // Check if project exists
            const existingProject = await database_1.prisma.dePINProject.findUnique({
                where: { id }
            });
            if (!existingProject) {
                response_1.ResponseUtil.notFound(res, 'Project not found');
                return;
            }
            // Check if name is being changed and already exists
            if (updates.name && updates.name !== existingProject.name) {
                const nameExists = await database_1.prisma.dePINProject.findUnique({
                    where: { name: updates.name }
                });
                if (nameExists) {
                    response_1.ResponseUtil.error(res, 'Project with this name already exists');
                    return;
                }
            }
            // Update project
            const updatedProject = await database_1.prisma.dePINProject.update({
                where: { id },
                data: {
                    ...updates,
                    updatedAt: new Date()
                }
            });
            logger_1.Logger.info('DePIN project updated', {
                projectId: id,
                updates: Object.keys(updates),
                userId: req.user?.id
            });
            const transformedProject = {
                id: updatedProject.id,
                name: updatedProject.name,
                category: updatedProject.category.toLowerCase(),
                description: updatedProject.description,
                nodes: '0', // This should be calculated
                capacity: '0 TiB',
                rewards: '$0/day',
                apy: updatedProject.apy,
                status: updatedProject.status.toLowerCase(),
                blockchain: updatedProject.blockchain,
                tokenSymbol: updatedProject.tokenSymbol,
                tokenPrice: updatedProject.tokenPrice,
                marketCap: updatedProject.marketCap,
                volume24h: updatedProject.volume24h,
                hardwareRequirement: updatedProject.hardwareRequirements,
                minInvestment: updatedProject.minInvestment,
                roiPeriod: updatedProject.roiPeriod,
                geographicFocus: updatedProject.geographicFocus,
                riskLevel: updatedProject.riskLevel.toLowerCase(),
                createdAt: updatedProject.createdAt,
                updatedAt: updatedProject.updatedAt
            };
            response_1.ResponseUtil.success(res, transformedProject, 'Project updated successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error updating project', { error: error.message });
            response_1.ResponseUtil.serverError(res);
        }
    }
    /**
     * Delete a project (Admin only)
     */
    static async deleteProject(req, res) {
        try {
            const { id } = req.params;
            // Check if project exists
            const project = await database_1.prisma.dePINProject.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: {
                            nodes: true
                        }
                    }
                }
            });
            if (!project) {
                response_1.ResponseUtil.notFound(res, 'Project not found');
                return;
            }
            // Check if project has active nodes
            if (project._count.nodes > 0) {
                response_1.ResponseUtil.error(res, 'Cannot delete project with active nodes');
                return;
            }
            // Delete project
            await database_1.prisma.dePINProject.delete({
                where: { id }
            });
            logger_1.Logger.info('DePIN project deleted', {
                projectId: id,
                projectName: project.name,
                userId: req.user?.id
            });
            response_1.ResponseUtil.success(res, null, 'Project deleted successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error deleting project', { error: error.message });
            response_1.ResponseUtil.serverError(res);
        }
    }
    /**
     * Get projects by category
     */
    static async getProjectsByCategory(req, res) {
        try {
            const { category } = req.params;
            const { page = 1, limit = 20 } = req.query;
            const validCategories = ['STORAGE', 'COMPUTING', 'WIRELESS', 'SENSORS'];
            const upperCategory = category.toUpperCase();
            if (!validCategories.includes(upperCategory)) {
                response_1.ResponseUtil.error(res, 'Invalid category');
                return;
            }
            const where = {
                category: upperCategory,
                status: 'ACTIVE'
            };
            const total = await database_1.prisma.dePINProject.count({ where });
            const projects = await database_1.prisma.dePINProject.findMany({
                where,
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    _count: {
                        select: {
                            nodes: true
                        }
                    }
                }
            });
            const transformedProjects = projects.map(project => ({
                id: project.id,
                name: project.name,
                category: project.category.toLowerCase(),
                description: project.description,
                nodes: project._count.nodes.toString(),
                capacity: 'N/A',
                rewards: 'N/A',
                apy: project.apy,
                status: project.status.toLowerCase(),
                blockchain: project.blockchain,
                tokenSymbol: project.tokenSymbol,
                tokenPrice: project.tokenPrice,
                marketCap: project.marketCap,
                volume24h: project.volume24h,
                hardwareRequirement: project.hardwareRequirements,
                minInvestment: project.minInvestment,
                roiPeriod: project.roiPeriod,
                geographicFocus: project.geographicFocus,
                riskLevel: project.riskLevel.toLowerCase()
            }));
            response_1.ResponseUtil.paginated(res, transformedProjects, {
                page: Number(page),
                limit: Number(limit),
                total
            }, `${category} projects retrieved successfully`);
        }
        catch (error) {
            logger_1.Logger.error('Error getting projects by category', { error: error.message });
            response_1.ResponseUtil.serverError(res);
        }
    }
}
exports.ProjectsController = ProjectsController;
//# sourceMappingURL=projects.controller.js.map