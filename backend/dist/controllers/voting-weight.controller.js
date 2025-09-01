"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VotingWeightController = void 0;
const response_1 = require("@/utils/response");
const logger_1 = require("@/utils/logger");
const voting_weight_service_1 = require("@/services/voting-weight.service");
const proposal_execution_service_1 = require("@/services/proposal-execution.service");
const database_1 = require("@/services/database");
class VotingWeightController {
    /**
     * 获取成员的投票权重
     */
    static async getMemberVotingPower(req, res) {
        try {
            const { daoId, memberId } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            // 验证用户是否为DAO成员
            const requestingMember = await database_1.prisma.dAOMember.findFirst({
                where: { daoId, userId }
            });
            if (!requestingMember) {
                response_1.ResponseUtil.forbidden(res, 'You must be a DAO member to view voting power');
                return;
            }
            // 获取目标成员信息
            const targetMember = await database_1.prisma.dAOMember.findUnique({
                where: { id: memberId }
            });
            if (!targetMember || targetMember.daoId !== daoId) {
                response_1.ResponseUtil.notFound(res, 'Member not found in this DAO');
                return;
            }
            const votingPower = await voting_weight_service_1.VotingWeightService.calculateVotingPower(memberId);
            response_1.ResponseUtil.success(res, {
                memberId,
                votingPower,
                lastUpdated: new Date()
            });
        }
        catch (error) {
            logger_1.Logger.error('Error getting member voting power', { error });
            response_1.ResponseUtil.error(res, 'Failed to get voting power');
        }
    }
    /**
     * 更新DAO所有成员的投票权重（仅管理员）
     */
    static async updateDAOVotingPowers(req, res) {
        try {
            const { daoId } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            // 验证用户是否为DAO管理员
            const member = await database_1.prisma.dAOMember.findFirst({
                where: { daoId, userId, role: 'ADMIN' }
            });
            if (!member) {
                response_1.ResponseUtil.forbidden(res, 'Only DAO admins can update voting powers');
                return;
            }
            await voting_weight_service_1.VotingWeightService.updateDAOVotingPowers(daoId);
            response_1.ResponseUtil.success(res, null, 'All DAO member voting powers updated successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error updating DAO voting powers', { error });
            response_1.ResponseUtil.error(res, 'Failed to update voting powers');
        }
    }
    /**
     * 获取提案的投票阈值检查结果
     */
    static async checkProposalThreshold(req, res) {
        try {
            const { proposalId } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            // 获取提案信息
            const proposal = await database_1.prisma.dAOProposal.findUnique({
                where: { id: proposalId }
            });
            if (!proposal) {
                response_1.ResponseUtil.notFound(res, 'Proposal not found');
                return;
            }
            // 验证用户是否为DAO成员
            const member = await database_1.prisma.dAOMember.findFirst({
                where: { daoId: proposal.daoId, userId }
            });
            if (!member) {
                response_1.ResponseUtil.forbidden(res, 'You must be a DAO member to check proposal threshold');
                return;
            }
            const thresholdResult = await voting_weight_service_1.VotingWeightService.checkProposalThreshold(proposalId);
            response_1.ResponseUtil.success(res, thresholdResult);
        }
        catch (error) {
            logger_1.Logger.error('Error checking proposal threshold', { error });
            response_1.ResponseUtil.error(res, 'Failed to check proposal threshold');
        }
    }
    /**
     * 获取DAO的法定人数阈值
     */
    static async getQuorumThreshold(req, res) {
        try {
            const { daoId } = req.params;
            const { quorumPercentage = '50' } = req.query;
            const userId = req.user?.id;
            if (!userId) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            // 验证用户是否为DAO成员
            const member = await database_1.prisma.dAOMember.findFirst({
                where: { daoId, userId }
            });
            if (!member) {
                response_1.ResponseUtil.forbidden(res, 'You must be a DAO member to view quorum threshold');
                return;
            }
            const threshold = await voting_weight_service_1.VotingWeightService.calculateQuorumThreshold(daoId, parseInt(quorumPercentage));
            response_1.ResponseUtil.success(res, {
                daoId,
                quorumPercentage: parseInt(quorumPercentage),
                requiredVotingPower: threshold
            });
        }
        catch (error) {
            logger_1.Logger.error('Error getting quorum threshold', { error });
            response_1.ResponseUtil.error(res, 'Failed to get quorum threshold');
        }
    }
    /**
     * 获取执行队列状态（仅管理员）
     */
    static async getExecutionQueueStatus(req, res) {
        try {
            const { daoId } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            // 验证用户是否为DAO管理员
            const member = await database_1.prisma.dAOMember.findFirst({
                where: { daoId, userId, role: 'ADMIN' }
            });
            if (!member) {
                response_1.ResponseUtil.forbidden(res, 'Only DAO admins can view execution queue status');
                return;
            }
            const queueStatus = proposal_execution_service_1.ProposalExecutionService.getQueueStatus();
            // 过滤只显示该DAO的任务
            const daoTasks = queueStatus.filter(async (task) => {
                const proposal = await database_1.prisma.dAOProposal.findUnique({
                    where: { id: task.proposalId }
                });
                return proposal?.daoId === daoId;
            });
            response_1.ResponseUtil.success(res, daoTasks);
        }
        catch (error) {
            logger_1.Logger.error('Error getting execution queue status', { error });
            response_1.ResponseUtil.error(res, 'Failed to get execution queue status');
        }
    }
    /**
     * 取消提案执行（仅管理员）
     */
    static async cancelProposalExecution(req, res) {
        try {
            const { proposalId } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            // 获取提案信息
            const proposal = await database_1.prisma.dAOProposal.findUnique({
                where: { id: proposalId }
            });
            if (!proposal) {
                response_1.ResponseUtil.notFound(res, 'Proposal not found');
                return;
            }
            // 验证用户是否为DAO管理员
            const member = await database_1.prisma.dAOMember.findFirst({
                where: {
                    daoId: proposal.daoId,
                    userId,
                    role: 'ADMIN'
                }
            });
            if (!member) {
                response_1.ResponseUtil.forbidden(res, 'Only DAO admins can cancel proposal execution');
                return;
            }
            await proposal_execution_service_1.ProposalExecutionService.cancelExecution(proposalId);
            response_1.ResponseUtil.success(res, null, 'Proposal execution cancelled successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error cancelling proposal execution', { error });
            response_1.ResponseUtil.error(res, 'Failed to cancel proposal execution');
        }
    }
    /**
     * 获取DAO成员投票权重排行榜
     */
    static async getVotingPowerRanking(req, res) {
        try {
            const { daoId } = req.params;
            const { limit = '10' } = req.query;
            const userId = req.user?.id;
            if (!userId) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            // 验证用户是否为DAO成员
            const member = await database_1.prisma.dAOMember.findFirst({
                where: { daoId, userId }
            });
            if (!member) {
                response_1.ResponseUtil.forbidden(res, 'You must be a DAO member to view voting power ranking');
                return;
            }
            const members = await database_1.prisma.dAOMember.findMany({
                where: {
                    daoId,
                    status: 'ACTIVE'
                },
                include: {
                    user: {
                        select: {
                            walletAddress: true
                        }
                    }
                },
                orderBy: {
                    votingPower: 'desc'
                },
                take: parseInt(limit)
            });
            const ranking = members.map((member, index) => ({
                rank: index + 1,
                address: member.address,
                walletAddress: member.user.walletAddress,
                votingPower: member.votingPower,
                role: member.role,
                contributionScore: member.contributionScore,
                reputation: member.reputation
            }));
            response_1.ResponseUtil.success(res, ranking);
        }
        catch (error) {
            logger_1.Logger.error('Error getting voting power ranking', { error });
            response_1.ResponseUtil.error(res, 'Failed to get voting power ranking');
        }
    }
}
exports.VotingWeightController = VotingWeightController;
//# sourceMappingURL=voting-weight.controller.js.map