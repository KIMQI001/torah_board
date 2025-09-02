"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAOProposalsController = void 0;
const response_1 = require("@/utils/response");
const logger_1 = require("@/utils/logger");
const database_1 = require("@/services/database");
const voting_weight_service_1 = require("@/services/voting-weight.service");
const proposal_execution_service_1 = require("@/services/proposal-execution.service");
const treasury_service_1 = require("@/services/treasury.service");
class DAOProposalsController {
    /**
     * Helper to attach user vote info to proposals
     */
    static async attachUserVoteInfo(proposals, userId) {
        if (!userId)
            return proposals;
        // Get user's member IDs for all DAOs
        const memberIds = await database_1.prisma.dAOMember.findMany({
            where: { userId },
            select: { id: true, daoId: true }
        });
        const memberIdMap = new Map(memberIds.map(m => [m.daoId, m.id]));
        // For each proposal, check if user has voted
        return Promise.all(proposals.map(async (proposal) => {
            const memberId = memberIdMap.get(proposal.daoId);
            if (!memberId)
                return proposal;
            const userVote = await database_1.prisma.dAOVote.findUnique({
                where: {
                    proposalId_memberId: {
                        proposalId: proposal.id,
                        memberId
                    }
                },
                select: {
                    voteType: true,
                    votingPower: true,
                    timestamp: true,
                    reason: true
                }
            });
            return {
                ...proposal,
                // 确保时间字段正确映射
                votingStartDate: proposal.startTime ? new Date(proposal.startTime).toISOString() : proposal.startTime,
                votingEndDate: proposal.endTime ? new Date(proposal.endTime).toISOString() : proposal.endTime,
                userVote: userVote ? {
                    voteType: userVote.voteType,
                    votingPower: userVote.votingPower,
                    votedAt: userVote.timestamp.toISOString(),
                    reason: userVote.reason
                } : undefined
            };
        }));
    }
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
            // Attach user vote info if user is authenticated
            const proposalsWithUserVote = await DAOProposalsController.attachUserVoteInfo(proposals, req.user?.id);
            response_1.ResponseUtil.success(res, proposalsWithUserVote);
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
            // Attach user vote info if user is authenticated
            if (req.user?.id) {
                const [proposalWithUserVote] = await DAOProposalsController.attachUserVoteInfo([proposal], req.user.id);
                response_1.ResponseUtil.success(res, proposalWithUserVote);
            }
            else {
                response_1.ResponseUtil.success(res, proposal);
            }
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
            const startTime = now; // Start immediately
            const endTime = new Date(startTime.getTime() + votingDays * 24 * 60 * 60 * 1000);
            const proposal = await database_1.prisma.dAOProposal.create({
                data: {
                    daoId,
                    title,
                    description,
                    proposer: member.address,
                    status: 'ACTIVE',
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
            res.status(201);
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
            logger_1.Logger.info('=== Vote request started ===', {
                userId: req.user?.id,
                params: req.params,
                body: req.body
            });
            const userId = req.user?.id;
            if (!userId) {
                logger_1.Logger.warn('Vote failed: No user ID');
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            const { id } = req.params;
            const { voteType, reason } = req.body;
            logger_1.Logger.info('Step 1: Getting proposal', { proposalId: id });
            // Get proposal
            const proposal = await database_1.prisma.dAOProposal.findUnique({
                where: { id }
            });
            if (!proposal) {
                logger_1.Logger.warn('Vote failed: Proposal not found', { proposalId: id });
                response_1.ResponseUtil.notFound(res, 'Proposal not found');
                return;
            }
            logger_1.Logger.info('Step 2: Proposal found, checking status', {
                proposalId: id,
                status: proposal.status,
                startTime: proposal.startTime,
                endTime: proposal.endTime,
                currentTime: new Date()
            });
            // Check if proposal is active
            const now = new Date();
            if (proposal.status !== 'ACTIVE' || now > proposal.endTime || now < proposal.startTime) {
                logger_1.Logger.warn('Vote failed: Voting not active', {
                    status: proposal.status,
                    isExpired: now > proposal.endTime,
                    notStarted: now < proposal.startTime
                });
                response_1.ResponseUtil.error(res, 'Voting is not active for this proposal');
                return;
            }
            logger_1.Logger.info('Step 3: Checking DAO membership', { daoId: proposal.daoId, userId });
            // Check if user is member of DAO
            const member = await database_1.prisma.dAOMember.findFirst({
                where: {
                    daoId: proposal.daoId,
                    userId
                },
                select: {
                    id: true,
                    votingPower: true,
                    role: true,
                    address: true
                }
            });
            if (!member) {
                logger_1.Logger.warn('Vote failed: User not a DAO member', { daoId: proposal.daoId, userId });
                response_1.ResponseUtil.forbidden(res, 'You must be a DAO member to vote');
                return;
            }
            logger_1.Logger.info('Step 4: Member found, checking existing vote', {
                memberId: member.id,
                memberAddress: member.address,
                votingPower: member.votingPower
            });
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
                logger_1.Logger.warn('Vote failed: Already voted', {
                    existingVote: {
                        voteType: existingVote.voteType,
                        timestamp: existingVote.timestamp
                    }
                });
                response_1.ResponseUtil.error(res, 'You have already voted on this proposal');
                return;
            }
            logger_1.Logger.info('Step 5: Creating vote record', {
                proposalId: id,
                memberId: member.id,
                voteType: voteType.toUpperCase(),
                votingPower: member.votingPower || 1
            });
            // Calculate current voting power
            const currentVotingPower = member.votingPower || 1;
            // Create vote
            const vote = await database_1.prisma.dAOVote.create({
                data: {
                    proposalId: id,
                    memberId: member.id,
                    voteType: voteType.toUpperCase(),
                    votingPower: currentVotingPower,
                    reason
                }
            });
            logger_1.Logger.info('Step 6: Vote created, updating proposal counts', {
                voteId: vote.id,
                voteType: vote.voteType
            });
            // Update proposal vote counts
            const voteField = voteType === 'FOR' ? 'votesFor' :
                voteType === 'AGAINST' ? 'votesAgainst' : 'votesAbstain';
            const updatedProposal = await database_1.prisma.dAOProposal.update({
                where: { id },
                data: {
                    [voteField]: { increment: currentVotingPower },
                    totalVotes: { increment: currentVotingPower }
                }
            });
            logger_1.Logger.info('Step 7: Proposal updated, checking auto-close conditions', {
                totalVotingPower: updatedProposal.totalVotes,
                votesFor: updatedProposal.votesFor,
                votesAgainst: updatedProposal.votesAgainst
            });
            // Check if we should auto-close the proposal (>50% threshold)
            if (updatedProposal.totalVotes > 0) {
                const forPercentage = (updatedProposal.votesFor / updatedProposal.totalVotes) * 100;
                const againstPercentage = (updatedProposal.votesAgainst / updatedProposal.totalVotes) * 100;
                logger_1.Logger.info('Vote percentages calculated', {
                    forPercentage: forPercentage.toFixed(2),
                    againstPercentage: againstPercentage.toFixed(2)
                });
                // Auto-close if either side has >50%
                if (forPercentage > 50 || againstPercentage > 50) {
                    const finalStatus = forPercentage > 50 ? 'PASSED' : 'FAILED';
                    logger_1.Logger.info('🎯 Auto-closing proposal due to majority vote', {
                        proposalId: id,
                        finalStatus,
                        forPercentage: forPercentage.toFixed(2),
                        againstPercentage: againstPercentage.toFixed(2)
                    });
                    await database_1.prisma.dAOProposal.update({
                        where: { id },
                        data: {
                            status: finalStatus,
                            endTime: now // Close voting immediately
                        }
                    });
                }
            }
            logger_1.Logger.info('Step 8: Updating member activity');
            // Update member activity
            await database_1.prisma.dAOMember.update({
                where: { id: member.id },
                data: {
                    votesParticipated: { increment: 1 },
                    lastActivity: now
                }
            });
            logger_1.Logger.info('✅ Vote cast successfully', {
                proposalId: id,
                memberId: member.id,
                voteType,
                votingPower: currentVotingPower,
                updatedCounts: {
                    votesFor: updatedProposal.votesFor,
                    votesAgainst: updatedProposal.votesAgainst,
                    totalVotes: updatedProposal.totalVotes
                }
            });
            response_1.ResponseUtil.success(res, vote, 'Vote cast successfully');
        }
        catch (error) {
            logger_1.Logger.error('❌ Error voting on proposal', {
                error: error.message,
                stack: error.stack,
                userId: req.user?.id,
                proposalId: req.params.id
            });
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
            // Use VotingWeightService to check threshold
            const thresholdResult = await voting_weight_service_1.VotingWeightService.checkProposalThreshold(id);
            if (!thresholdResult.passed) {
                // Mark as failed
                await database_1.prisma.dAOProposal.update({
                    where: { id },
                    data: { status: 'FAILED' }
                });
                response_1.ResponseUtil.error(res, `Proposal failed: ${thresholdResult.quorumReached ?
                    `Threshold not met (${thresholdResult.forPercentage.toFixed(1)}% for vs ${proposal.threshold}% required)` :
                    'Quorum not reached'}`);
                return;
            }
            // Check if funding is available for treasury/investment proposals
            if (proposal.requestedAmount && proposal.requestedAmount > 0) {
                const fundsAvailable = await treasury_service_1.TreasuryService.checkFundsAvailability(proposal.daoId, proposal.requestedAmount);
                if (!fundsAvailable) {
                    response_1.ResponseUtil.error(res, 'Insufficient treasury funds to execute proposal');
                    return;
                }
            }
            // Queue proposal for execution with timelock
            await proposal_execution_service_1.ProposalExecutionService.queueProposalExecution(id);
            response_1.ResponseUtil.success(res, {
                message: 'Proposal passed and queued for execution',
                executionTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
            }, 'Proposal queued for execution with 24-hour timelock');
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
     * Delete proposal
     */
    static async deleteProposal(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const proposal = await database_1.prisma.dAOProposal.findUnique({
                where: { id },
                include: { dao: true }
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
                response_1.ResponseUtil.forbidden(res, 'Only admins or proposal creator can delete proposals');
                return;
            }
            // Can't delete executed or active proposals with votes
            if (proposal.status === 'EXECUTED') {
                response_1.ResponseUtil.error(res, 'Cannot delete an executed proposal');
                return;
            }
            // Check if proposal has votes
            const voteCount = await database_1.prisma.dAOVote.count({
                where: { proposalId: id }
            });
            if (voteCount > 0) {
                response_1.ResponseUtil.error(res, 'Cannot delete a proposal that already has votes');
                return;
            }
            // Delete the proposal
            await database_1.prisma.dAOProposal.delete({
                where: { id }
            });
            logger_1.Logger.info('Proposal deleted', { proposalId: id });
            response_1.ResponseUtil.success(res, { id }, 'Proposal deleted successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error deleting proposal', { error });
            response_1.ResponseUtil.error(res, 'Failed to delete proposal');
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