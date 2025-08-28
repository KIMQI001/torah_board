"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAOProposalsController = void 0;
const response_1 = require("@/utils/response");
const logger_1 = require("@/utils/logger");
const database_1 = require("@/services/database");
class DAOProposalsController {
    /**
     * Get proposals for a DAO
     */
    static async getProposals(req, res) {
        try {
            const { daoId } = req.params;
            const { status, category, page = '1', limit = '20' } = req.query;
            const where = { daoId };
            if (status)
                where.status = status;
            if (category)
                where.category = category;
            const proposals = await database_1.prisma.dAOProposal.findMany({
                where,
                include: {
                    votes: {
                        include: {
                            member: {
                                select: {
                                    address: true,
                                    votingPower: true
                                }
                            }
                        }
                    },
                    _count: {
                        select: { votes: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit)
            });
            response_1.ResponseUtil.success(res, proposals);
        }
        catch (error) {
            logger_1.Logger.error('Error fetching proposals', { error });
            response_1.ResponseUtil.error(res, 'Failed to fetch proposals');
        }
    }
    /**
     * Get single proposal
     */
    static async getProposal(req, res) {
        try {
            const { id } = req.params;
            const proposal = await database_1.prisma.dAOProposal.findUnique({
                where: { id },
                include: {
                    dao: {
                        select: {
                            name: true,
                            governanceToken: true
                        }
                    },
                    votes: {
                        include: {
                            member: {
                                include: {
                                    user: {
                                        select: {
                                            walletAddress: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    _count: {
                        select: { votes: true }
                    }
                }
            });
            if (!proposal) {
                response_1.ResponseUtil.notFound(res, 'Proposal not found');
                return;
            }
            response_1.ResponseUtil.success(res, proposal);
        }
        catch (error) {
            logger_1.Logger.error('Error fetching proposal', { error });
            response_1.ResponseUtil.error(res, 'Failed to fetch proposal');
        }
    }
    /**
     * Create new proposal
     */
    static async createProposal(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            const { daoId } = req.params;
            const { title, description, category, requestedAmount, votingPeriodDays, threshold, discussion, attachments } = req.body;
            // Check if user is member of DAO
            const member = await database_1.prisma.dAOMember.findFirst({
                where: { daoId, userId }
            });
            if (!member) {
                response_1.ResponseUtil.forbidden(res, 'You must be a DAO member to create proposals');
                return;
            }
            // Get DAO settings
            const dao = await database_1.prisma.dAO.findUnique({
                where: { id: daoId }
            });
            if (!dao) {
                response_1.ResponseUtil.notFound(res, 'DAO not found');
                return;
            }
            const now = new Date();
            const votingDays = votingPeriodDays || dao.votingPeriod;
            const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Start tomorrow
            const endTime = new Date(startTime.getTime() + votingDays * 24 * 60 * 60 * 1000);
            const proposal = await database_1.prisma.dAOProposal.create({
                data: {
                    daoId,
                    title,
                    description,
                    proposer: member.address,
                    status: 'DRAFT',
                    category: category.toUpperCase(),
                    requestedAmount,
                    quorum: dao.quorumThreshold,
                    threshold: threshold || 60,
                    startTime,
                    endTime,
                    discussion,
                    attachments: attachments ? JSON.stringify(attachments) : null
                }
            });
            // Update member's proposal count
            await database_1.prisma.dAOMember.update({
                where: { id: member.id },
                data: {
                    proposalsCreated: { increment: 1 },
                    lastActivity: now
                }
            });
            logger_1.Logger.info('Proposal created', {
                proposalId: proposal.id,
                daoId,
                createdBy: userId
            });
            response_1.ResponseUtil.success(res, proposal, 'Proposal created successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error creating proposal', { error });
            response_1.ResponseUtil.error(res, 'Failed to create proposal');
        }
    }
    /**
     * Vote on proposal
     */
    static async voteOnProposal(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            const { id } = req.params;
            const { voteType, reason } = req.body;
            // Get proposal
            const proposal = await database_1.prisma.dAOProposal.findUnique({
                where: { id }
            });
            if (!proposal) {
                response_1.ResponseUtil.notFound(res, 'Proposal not found');
                return;
            }
            // Check if proposal is active
            const now = new Date();
            if (proposal.status !== 'ACTIVE' || now > proposal.endTime || now < proposal.startTime) {
                response_1.ResponseUtil.error(res, 'Voting is not active for this proposal');
                return;
            }
            // Check if user is member of DAO
            const member = await database_1.prisma.dAOMember.findFirst({
                where: {
                    daoId: proposal.daoId,
                    userId
                }
            });
            if (!member) {
                response_1.ResponseUtil.forbidden(res, 'You must be a DAO member to vote');
                return;
            }
            // Check if already voted
            const existingVote = await database_1.prisma.dAOVote.findUnique({
                where: {
                    proposalId_memberId: {
                        proposalId: id,
                        memberId: member.id
                    }
                }
            });
            if (existingVote) {
                response_1.ResponseUtil.error(res, 'You have already voted on this proposal');
                return;
            }
            // Create vote
            const vote = await database_1.prisma.dAOVote.create({
                data: {
                    proposalId: id,
                    memberId: member.id,
                    voteType: voteType.toUpperCase(),
                    votingPower: member.votingPower,
                    reason
                }
            });
            // Update proposal vote counts
            const voteField = voteType === 'FOR' ? 'votesFor' :
                voteType === 'AGAINST' ? 'votesAgainst' : 'votesAbstain';
            await database_1.prisma.dAOProposal.update({
                where: { id },
                data: {
                    [voteField]: { increment: member.votingPower },
                    totalVotes: { increment: member.votingPower }
                }
            });
            // Update member activity
            await database_1.prisma.dAOMember.update({
                where: { id: member.id },
                data: {
                    votesParticipated: { increment: 1 },
                    lastActivity: now
                }
            });
            logger_1.Logger.info('Vote cast', {
                proposalId: id,
                memberId: member.id,
                voteType,
                votingPower: member.votingPower
            });
            response_1.ResponseUtil.success(res, vote, 'Vote cast successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error voting on proposal', { error });
            response_1.ResponseUtil.error(res, 'Failed to cast vote');
        }
    }
    /**
     * Activate proposal (move from DRAFT to ACTIVE)
     */
    static async activateProposal(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const proposal = await database_1.prisma.dAOProposal.findUnique({
                where: { id },
                include: {
                    dao: true
                }
            });
            if (!proposal) {
                response_1.ResponseUtil.notFound(res, 'Proposal not found');
                return;
            }
            // Check if user is admin or proposal creator
            const member = await database_1.prisma.dAOMember.findFirst({
                where: {
                    daoId: proposal.daoId,
                    userId
                }
            });
            if (!member || (member.role !== 'ADMIN' && member.address !== proposal.proposer)) {
                response_1.ResponseUtil.forbidden(res, 'Only admins or proposal creator can activate proposals');
                return;
            }
            if (proposal.status !== 'DRAFT') {
                response_1.ResponseUtil.error(res, 'Only draft proposals can be activated');
                return;
            }
            const updatedProposal = await database_1.prisma.dAOProposal.update({
                where: { id },
                data: { status: 'ACTIVE' }
            });
            logger_1.Logger.info('Proposal activated', { proposalId: id });
            response_1.ResponseUtil.success(res, updatedProposal, 'Proposal activated successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error activating proposal', { error });
            response_1.ResponseUtil.error(res, 'Failed to activate proposal');
        }
    }
    /**
     * Execute proposal after voting passes
     */
    static async executeProposal(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const proposal = await database_1.prisma.dAOProposal.findUnique({
                where: { id },
                include: {
                    dao: true
                }
            });
            if (!proposal) {
                response_1.ResponseUtil.notFound(res, 'Proposal not found');
                return;
            }
            // Check if user is admin
            const member = await database_1.prisma.dAOMember.findFirst({
                where: {
                    daoId: proposal.daoId,
                    userId,
                    role: 'ADMIN'
                }
            });
            if (!member) {
                response_1.ResponseUtil.forbidden(res, 'Only admins can execute proposals');
                return;
            }
            // Check if proposal has passed
            const now = new Date();
            if (proposal.status !== 'ACTIVE' || now < proposal.endTime) {
                response_1.ResponseUtil.error(res, 'Proposal must finish voting before execution');
                return;
            }
            // Check if proposal met quorum and threshold
            const quorumMet = proposal.totalVotes >= proposal.quorum;
            const thresholdMet = proposal.totalVotes > 0 &&
                (proposal.votesFor / proposal.totalVotes) * 100 >= proposal.threshold;
            if (!quorumMet || !thresholdMet) {
                // Mark as failed
                await database_1.prisma.dAOProposal.update({
                    where: { id },
                    data: { status: 'FAILED' }
                });
                response_1.ResponseUtil.error(res, 'Proposal did not meet quorum or threshold requirements');
                return;
            }
            // Execute proposal (create treasury transaction if needed)
            if (proposal.requestedAmount && proposal.requestedAmount > 0) {
                await database_1.prisma.dAOTreasury.create({
                    data: {
                        daoId: proposal.daoId,
                        type: 'INVESTMENT',
                        amount: proposal.requestedAmount,
                        token: 'USDC', // Default token
                        description: `Execution of proposal: ${proposal.title}`,
                        proposalId: id,
                        status: 'PENDING'
                    }
                });
            }
            const updatedProposal = await database_1.prisma.dAOProposal.update({
                where: { id },
                data: {
                    status: 'EXECUTED',
                    executionTime: now
                }
            });
            logger_1.Logger.info('Proposal executed', {
                proposalId: id,
                executedBy: userId
            });
            response_1.ResponseUtil.success(res, updatedProposal, 'Proposal executed successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error executing proposal', { error });
            response_1.ResponseUtil.error(res, 'Failed to execute proposal');
        }
    }
    /**
     * Cancel proposal
     */
    static async cancelProposal(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const proposal = await database_1.prisma.dAOProposal.findUnique({
                where: { id }
            });
            if (!proposal) {
                response_1.ResponseUtil.notFound(res, 'Proposal not found');
                return;
            }
            // Check if user is admin or proposal creator
            const member = await database_1.prisma.dAOMember.findFirst({
                where: {
                    daoId: proposal.daoId,
                    userId
                }
            });
            if (!member || (member.role !== 'ADMIN' && member.address !== proposal.proposer)) {
                response_1.ResponseUtil.forbidden(res, 'Only admins or proposal creator can cancel proposals');
                return;
            }
            if (['EXECUTED', 'CANCELLED'].includes(proposal.status)) {
                response_1.ResponseUtil.error(res, 'Cannot cancel an executed or already cancelled proposal');
                return;
            }
            const updatedProposal = await database_1.prisma.dAOProposal.update({
                where: { id },
                data: { status: 'CANCELLED' }
            });
            logger_1.Logger.info('Proposal cancelled', { proposalId: id });
            response_1.ResponseUtil.success(res, updatedProposal, 'Proposal cancelled successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error cancelling proposal', { error });
            response_1.ResponseUtil.error(res, 'Failed to cancel proposal');
        }
    }
}
exports.DAOProposalsController = DAOProposalsController;
//# sourceMappingURL=dao-proposals.controller.js.map