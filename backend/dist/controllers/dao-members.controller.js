"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAOMembersController = void 0;
const response_1 = require("@/utils/response");
const logger_1 = require("@/utils/logger");
const database_1 = require("@/services/database");
class DAOMembersController {
    /**
     * Get members for a DAO
     */
    static async getMembers(req, res) {
        try {
            const { daoId } = req.params;
            const { role, status, page = '1', limit = '50' } = req.query;
            const where = { daoId };
            if (role)
                where.role = role;
            if (status)
                where.status = status;
            const members = await database_1.prisma.dAOMember.findMany({
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
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit)
            });
            response_1.ResponseUtil.success(res, members);
        }
        catch (error) {
            logger_1.Logger.error('Error fetching members', { error });
            response_1.ResponseUtil.error(res, 'Failed to fetch members');
        }
    }
    /**
     * Get member details
     */
    static async getMember(req, res) {
        try {
            const { daoId, memberId } = req.params;
            const member = await database_1.prisma.dAOMember.findFirst({
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
                response_1.ResponseUtil.notFound(res, 'Member not found');
                return;
            }
            response_1.ResponseUtil.success(res, member);
        }
        catch (error) {
            logger_1.Logger.error('Error fetching member', { error });
            response_1.ResponseUtil.error(res, 'Failed to fetch member');
        }
    }
    /**
     * Update member role (Admin only)
     */
    static async updateMemberRole(req, res) {
        try {
            const { daoId, memberId } = req.params;
            const { role } = req.body;
            const userId = req.user?.id;
            // Check if requester is admin
            const requester = await database_1.prisma.dAOMember.findFirst({
                where: {
                    daoId,
                    userId,
                    role: 'ADMIN'
                }
            });
            if (!requester) {
                response_1.ResponseUtil.forbidden(res, 'Only admins can update member roles');
                return;
            }
            // Check if member exists
            const member = await database_1.prisma.dAOMember.findFirst({
                where: { id: memberId, daoId }
            });
            if (!member) {
                response_1.ResponseUtil.notFound(res, 'Member not found');
                return;
            }
            // Prevent self-demotion of last admin
            if (member.userId === userId && member.role === 'ADMIN' && role !== 'ADMIN') {
                const otherAdmins = await database_1.prisma.dAOMember.count({
                    where: {
                        daoId,
                        role: 'ADMIN',
                        id: { not: memberId }
                    }
                });
                if (otherAdmins === 0) {
                    response_1.ResponseUtil.error(res, 'Cannot demote the last admin');
                    return;
                }
            }
            const updatedMember = await database_1.prisma.dAOMember.update({
                where: { id: memberId },
                data: {
                    role: role.toUpperCase(),
                    lastActivity: new Date()
                }
            });
            logger_1.Logger.info('Member role updated', {
                memberId,
                daoId,
                newRole: role,
                updatedBy: userId
            });
            response_1.ResponseUtil.success(res, updatedMember, 'Member role updated successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error updating member role', { error });
            response_1.ResponseUtil.error(res, 'Failed to update member role');
        }
    }
    /**
     * Update member voting power (Admin only)
     */
    static async updateVotingPower(req, res) {
        try {
            const { daoId, memberId } = req.params;
            const { votingPower } = req.body;
            const userId = req.user?.id;
            // Check if requester is admin
            const requester = await database_1.prisma.dAOMember.findFirst({
                where: {
                    daoId,
                    userId,
                    role: 'ADMIN'
                }
            });
            if (!requester) {
                response_1.ResponseUtil.forbidden(res, 'Only admins can update voting power');
                return;
            }
            const updatedMember = await database_1.prisma.dAOMember.update({
                where: { id: memberId },
                data: {
                    votingPower: parseFloat(votingPower),
                    lastActivity: new Date()
                }
            });
            logger_1.Logger.info('Member voting power updated', {
                memberId,
                daoId,
                newVotingPower: votingPower,
                updatedBy: userId
            });
            response_1.ResponseUtil.success(res, updatedMember, 'Voting power updated successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error updating voting power', { error });
            response_1.ResponseUtil.error(res, 'Failed to update voting power');
        }
    }
    /**
     * Remove member from DAO (Admin only)
     */
    static async removeMember(req, res) {
        try {
            const { daoId, memberId } = req.params;
            const userId = req.user?.id;
            // Check if requester is admin
            const requester = await database_1.prisma.dAOMember.findFirst({
                where: {
                    daoId,
                    userId,
                    role: 'ADMIN'
                }
            });
            if (!requester) {
                response_1.ResponseUtil.forbidden(res, 'Only admins can remove members');
                return;
            }
            // Check if member exists
            const member = await database_1.prisma.dAOMember.findFirst({
                where: { id: memberId, daoId }
            });
            if (!member) {
                response_1.ResponseUtil.notFound(res, 'Member not found');
                return;
            }
            // Prevent removal of last admin
            if (member.role === 'ADMIN') {
                const otherAdmins = await database_1.prisma.dAOMember.count({
                    where: {
                        daoId,
                        role: 'ADMIN',
                        id: { not: memberId }
                    }
                });
                if (otherAdmins === 0) {
                    response_1.ResponseUtil.error(res, 'Cannot remove the last admin');
                    return;
                }
            }
            await database_1.prisma.dAOMember.delete({
                where: { id: memberId }
            });
            logger_1.Logger.info('Member removed from DAO', {
                memberId,
                daoId,
                removedBy: userId
            });
            response_1.ResponseUtil.success(res, null, 'Member removed successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error removing member', { error });
            response_1.ResponseUtil.error(res, 'Failed to remove member');
        }
    }
    /**
     * Get member activity (voting history, proposals created)
     */
    static async getMemberActivity(req, res) {
        try {
            const { daoId, memberId } = req.params;
            const member = await database_1.prisma.dAOMember.findFirst({
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
                response_1.ResponseUtil.notFound(res, 'Member not found');
                return;
            }
            // Get proposals created by this member
            const proposalsCreated = await database_1.prisma.dAOProposal.findMany({
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
            response_1.ResponseUtil.success(res, activity);
        }
        catch (error) {
            logger_1.Logger.error('Error fetching member activity', { error });
            response_1.ResponseUtil.error(res, 'Failed to fetch member activity');
        }
    }
    /**
     * Update member contribution score
     */
    static async updateContributionScore(req, res) {
        try {
            const { daoId, memberId } = req.params;
            const { contributionScore, reason } = req.body;
            const userId = req.user?.id;
            // Check if requester is admin
            const requester = await database_1.prisma.dAOMember.findFirst({
                where: {
                    daoId,
                    userId,
                    role: 'ADMIN'
                }
            });
            if (!requester) {
                response_1.ResponseUtil.forbidden(res, 'Only admins can update contribution scores');
                return;
            }
            const updatedMember = await database_1.prisma.dAOMember.update({
                where: { id: memberId },
                data: {
                    contributionScore: parseFloat(contributionScore),
                    lastActivity: new Date()
                }
            });
            logger_1.Logger.info('Member contribution score updated', {
                memberId,
                daoId,
                newScore: contributionScore,
                reason,
                updatedBy: userId
            });
            response_1.ResponseUtil.success(res, updatedMember, 'Contribution score updated successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error updating contribution score', { error });
            response_1.ResponseUtil.error(res, 'Failed to update contribution score');
        }
    }
}
exports.DAOMembersController = DAOMembersController;
//# sourceMappingURL=dao-members.controller.js.map