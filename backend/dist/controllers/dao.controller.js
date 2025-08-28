"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAOController = void 0;
const response_1 = require("@/utils/response");
const logger_1 = require("@/utils/logger");
const database_1 = require("@/services/database");
class DAOController {
    /**
     * Get all DAOs or user's DAOs
     */
    static async getDAOs(req, res) {
        try {
            const { userId } = req.query;
            const where = userId ? {
                members: {
                    some: {
                        userId: userId
                    }
                }
            } : {};
            const daos = await database_1.prisma.dAO.findMany({
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
            response_1.ResponseUtil.success(res, daos);
        }
        catch (error) {
            logger_1.Logger.error('Error fetching DAOs', { error });
            response_1.ResponseUtil.error(res, 'Failed to fetch DAOs');
        }
    }
    /**
     * Get DAO by ID
     */
    static async getDAO(req, res) {
        try {
            const { id } = req.params;
            const dao = await database_1.prisma.dAO.findUnique({
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
                response_1.ResponseUtil.notFound(res, 'DAO not found');
                return;
            }
            response_1.ResponseUtil.success(res, dao);
        }
        catch (error) {
            logger_1.Logger.error('Error fetching DAO', { error });
            response_1.ResponseUtil.error(res, 'Failed to fetch DAO');
        }
    }
    /**
     * Create new DAO
     */
    static async createDAO(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            const { name, description, treasuryAddress, governanceToken, totalSupply, quorumThreshold, votingPeriod } = req.body;
            // Check if DAO name already exists
            const existing = await database_1.prisma.dAO.findUnique({
                where: { name }
            });
            if (existing) {
                response_1.ResponseUtil.error(res, 'DAO name already exists');
                return;
            }
            // Create DAO with creator as admin member
            const dao = await database_1.prisma.dAO.create({
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
            logger_1.Logger.info('DAO created', {
                daoId: dao.id,
                name: dao.name,
                createdBy: userId
            });
            response_1.ResponseUtil.success(res, dao, 'DAO created successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error creating DAO', { error });
            response_1.ResponseUtil.error(res, 'Failed to create DAO');
        }
    }
    /**
     * Update DAO
     */
    static async updateDAO(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            // Check if user is admin of this DAO
            const member = await database_1.prisma.dAOMember.findFirst({
                where: {
                    daoId: id,
                    userId,
                    role: 'ADMIN'
                }
            });
            if (!member) {
                response_1.ResponseUtil.forbidden(res, 'Only DAO admins can update DAO settings');
                return;
            }
            const updates = req.body;
            delete updates.id;
            delete updates.createdBy;
            const dao = await database_1.prisma.dAO.update({
                where: { id },
                data: updates
            });
            logger_1.Logger.info('DAO updated', { daoId: id, updates });
            response_1.ResponseUtil.success(res, dao, 'DAO updated successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error updating DAO', { error });
            response_1.ResponseUtil.error(res, 'Failed to update DAO');
        }
    }
    /**
     * Join DAO as member
     */
    static async joinDAO(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            // Check if already a member
            const existing = await database_1.prisma.dAOMember.findFirst({
                where: {
                    daoId: id,
                    userId
                }
            });
            if (existing) {
                response_1.ResponseUtil.error(res, 'You are already a member of this DAO');
                return;
            }
            // Create member entry
            const member = await database_1.prisma.dAOMember.create({
                data: {
                    daoId: id,
                    userId,
                    address: req.user.walletAddress,
                    role: 'MEMBER',
                    votingPower: 1000 // Default voting power
                }
            });
            logger_1.Logger.info('User joined DAO', { userId, daoId: id });
            response_1.ResponseUtil.success(res, member, 'Successfully joined DAO');
        }
        catch (error) {
            logger_1.Logger.error('Error joining DAO', { error });
            response_1.ResponseUtil.error(res, 'Failed to join DAO');
        }
    }
    /**
     * Leave DAO
     */
    static async leaveDAO(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            // Check if user is admin (admins cannot leave)
            const member = await database_1.prisma.dAOMember.findFirst({
                where: {
                    daoId: id,
                    userId
                }
            });
            if (!member) {
                response_1.ResponseUtil.error(res, 'You are not a member of this DAO');
                return;
            }
            if (member.role === 'ADMIN') {
                // Check if there are other admins
                const otherAdmins = await database_1.prisma.dAOMember.count({
                    where: {
                        daoId: id,
                        role: 'ADMIN',
                        userId: { not: userId }
                    }
                });
                if (otherAdmins === 0) {
                    response_1.ResponseUtil.error(res, 'Cannot leave DAO as the only admin');
                    return;
                }
            }
            await database_1.prisma.dAOMember.delete({
                where: { id: member.id }
            });
            logger_1.Logger.info('User left DAO', { userId, daoId: id });
            response_1.ResponseUtil.success(res, null, 'Successfully left DAO');
        }
        catch (error) {
            logger_1.Logger.error('Error leaving DAO', { error });
            response_1.ResponseUtil.error(res, 'Failed to leave DAO');
        }
    }
    /**
     * Get DAO statistics
     */
    static async getDAOStats(req, res) {
        try {
            const { id } = req.params;
            const [memberCount, activeProposals, activeProjects, treasuryTransactions, totalDistributed] = await Promise.all([
                database_1.prisma.dAOMember.count({ where: { daoId: id } }),
                database_1.prisma.dAOProposal.count({
                    where: { daoId: id, status: 'ACTIVE' }
                }),
                database_1.prisma.dAOProject.count({
                    where: { daoId: id, status: 'ACTIVE' }
                }),
                database_1.prisma.dAOTreasury.findMany({
                    where: { daoId: id },
                    select: {
                        type: true,
                        amount: true,
                        token: true,
                        status: true
                    }
                }),
                database_1.prisma.dAODistribution.aggregate({
                    where: { daoId: id },
                    _sum: { totalDistributed: true }
                })
            ]);
            // Calculate treasury balance by token
            const treasuryBalance = {};
            treasuryTransactions.forEach(tx => {
                if (tx.status === 'CONFIRMED') {
                    if (!treasuryBalance[tx.token]) {
                        treasuryBalance[tx.token] = 0;
                    }
                    if (tx.type === 'DEPOSIT') {
                        treasuryBalance[tx.token] += tx.amount;
                    }
                    else if (['WITHDRAWAL', 'INVESTMENT', 'REWARD', 'FEE', 'MILESTONE_PAYMENT'].includes(tx.type)) {
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
            response_1.ResponseUtil.success(res, stats);
        }
        catch (error) {
            logger_1.Logger.error('Error fetching DAO stats', { error });
            response_1.ResponseUtil.error(res, 'Failed to fetch DAO statistics');
        }
    }
    /**
     * Delete DAO (Admin only)
     */
    static async deleteDAO(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            // Check if user is admin of this DAO
            const member = await database_1.prisma.dAOMember.findFirst({
                where: {
                    daoId: id,
                    userId,
                    role: 'ADMIN'
                }
            });
            if (!member) {
                response_1.ResponseUtil.forbidden(res, 'Only DAO admins can delete the DAO');
                return;
            }
            // Check if DAO exists
            const dao = await database_1.prisma.dAO.findUnique({
                where: { id }
            });
            if (!dao) {
                response_1.ResponseUtil.notFound(res, 'DAO not found');
                return;
            }
            // Delete DAO and all related data (cascade delete)
            await database_1.prisma.dAO.delete({
                where: { id }
            });
            logger_1.Logger.info('DAO deleted', { daoId: id, deletedBy: userId });
            response_1.ResponseUtil.success(res, null, 'DAO deleted successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error deleting DAO', { error });
            response_1.ResponseUtil.error(res, 'Failed to delete DAO');
        }
    }
}
exports.DAOController = DAOController;
//# sourceMappingURL=dao.controller.js.map